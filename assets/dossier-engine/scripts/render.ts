import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { basename, join, resolve } from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import type { Dossier, DossierSlide } from "../src/schema/types";
import { validateDossier } from "../src/schema/validation";
import { parseArgs } from "./lib/args";
import { hydrateAssets, loadDossier } from "./lib/input";
import { A4_LANDSCAPE, createDossierPdf } from "./lib/pdf";
import { createContactSheet } from "./lib/contact-sheet";
import { prepareRenderFonts, verifyRenderedFonts } from "./lib/render-fonts";
import {
  cleanupRenderWorkspace,
  prepareRenderWorkspace,
  publishRenderWorkspace,
} from "./lib/render-output";
import { createRenderReport, type RenderIntegrity } from "./lib/render-report";
import { isAllowedRenderRequest, isAllowedRenderSocket } from "./lib/render-security";

interface OverflowFinding {
  height: string;
  id: string;
  tag: string;
  width: string;
}

interface RenderTarget {
  index: number;
  slide: DossierSlide;
}

async function openPort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createNetServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (typeof address === "string" || address === null) {
        server.close();
        reject(new Error("Impossible d'allouer un port local."));
        return;
      }
      server.close((error) => error ? reject(error) : resolvePort(address.port));
    });
  });
}

function safeName(value: string): string {
  const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64);
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(filePath: string): Promise<string> {
  return sha256(await readFile(filePath));
}

function assertBrowserIntegrity(runtimeErrors: readonly string[], externalRequests: ReadonlySet<string>): void {
  if (externalRequests.size > 0) {
    throw new Error(`Requêtes navigateur externes bloquées:\n${[...externalRequests].join("\n")}`);
  }
  if (runtimeErrors.length > 0) throw new Error(`Erreurs navigateur:\n${runtimeErrors.join("\n")}`);
}

function selectSlides(dossier: Dossier, selectors?: readonly string[]): RenderTarget[] {
  const all = dossier.slides.map((slide, index) => ({ index, slide }));
  if (!selectors || selectors.length === 0) return all;
  const selected = all.filter(({ index, slide }) => {
    const page = String(index + 1);
    const padded = page.padStart(2, "0");
    return selectors.includes(page) || selectors.includes(padded) || selectors.includes(slide.id);
  });
  if (selected.length !== selectors.length) {
    const matched = new Set(selected.flatMap(({ index, slide }) => [String(index + 1), String(index + 1).padStart(2, "0"), slide.id]));
    const missing = selectors.filter((selector) => !matched.has(selector));
    if (missing.length > 0) throw new Error(`Slides introuvables: ${missing.join(", ")}`);
  }
  return selected;
}

async function findOverflow(page: Page): Promise<OverflowFinding[]> {
  return page.locator("[data-fit]").evaluateAll((elements) => elements.flatMap((element) => {
    const node = element as HTMLElement;
    const lineHeight = Number.parseFloat(window.getComputedStyle(node).lineHeight);
    const glyphAllowance = Number.isFinite(lineHeight) ? Math.max(3, lineHeight * .22) : 3;
    const overflowX = node.scrollWidth > node.clientWidth + 2;
    const overflowY = node.scrollHeight > node.clientHeight + glyphAllowance;
    if (!overflowX && !overflowY) return [];
    const slide = node.closest<HTMLElement>(".slide");
    return [{
      height: `${node.clientHeight}/${node.scrollHeight}`,
      id: slide?.dataset.slideId ?? "inconnu",
      tag: node.tagName.toLowerCase(),
      width: `${node.clientWidth}/${node.scrollWidth}`,
    }];
  }));
}

async function findMissingImages(page: Page): Promise<string[]> {
  return page.locator("img").evaluateAll((images) => images.flatMap((image) => {
    const node = image as HTMLImageElement;
    if (node.complete && node.naturalWidth > 0 && node.dataset.missing !== "true") return [];
    return [node.dataset.assetSource ?? node.currentSrc ?? node.src ?? "source inconnue"];
  }));
}

async function verifyPreviewWidths(page: Page, baseUrl: string): Promise<void> {
  for (const width of [375, 1440]) {
    await page.setViewportSize({ height: 900, width });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.evaluate(async () => { await document.fonts.ready; });
    const bounds = await page.evaluate(() => {
      const firstSlide = document.querySelector<HTMLElement>(".slide");
      const rect = firstSlide?.getBoundingClientRect();
      return { documentWidth: document.documentElement.scrollWidth, right: rect?.right ?? 0 };
    });
    if (bounds.documentWidth > width + 1 || bounds.right > width + 1) {
      throw new Error(`Prévisualisation trop large à ${width}px: ${bounds.documentWidth}px.`);
    }
  }
}

async function renderDossier(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const inputPath = resolve(options.inputPath);
  const outputPath = resolve(options.outputPath);
  const workspace = await prepareRenderWorkspace(outputPath);
  let viteServer: ViteDevServer | undefined;
  let browser: Browser | undefined;
  try {
    const dossier = await loadDossier(inputPath);
    const errors = validateDossier(dossier).filter((entry) => entry.level === "error");
    if (errors.length > 0) throw new Error(errors.map((entry) => `${entry.path}: ${entry.message}`).join("\n"));
    const hydrated = await hydrateAssets(dossier, inputPath);
    const preparedFonts = await prepareRenderFonts(hydrated.theme, inputPath);
    const targets = selectSlides(hydrated, options.slides);
    const port = await openPort();
    viteServer = await createViteServer({
      configFile: resolve("vite.config.ts"),
      logLevel: "error",
      server: { host: "127.0.0.1", port, strictPort: true },
    });
    await viteServer.listen();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      colorScheme: "light",
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      viewport: { height: 1478, width: 2064 },
    });
    const runtimeErrors: string[] = [];
    const externalRequests = new Set<string>();
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    await page.addInitScript((payload: unknown) => { window.__DOSSIER_DATA__ = payload; }, hydrated);
    const baseUrl = `http://127.0.0.1:${port}/`;
    const localOrigin = new URL(baseUrl).origin;
    await page.route("**/*", async (route) => {
      const requestUrl = route.request().url();
      if (isAllowedRenderRequest(requestUrl, localOrigin)) await route.continue();
      else {
        externalRequests.add(requestUrl);
        await route.abort("blockedbyclient");
      }
    });
    await page.routeWebSocket("**/*", async (socket) => {
      const socketUrl = socket.url();
      if (isAllowedRenderSocket(socketUrl, localOrigin)) socket.connectToServer();
      else {
        externalRequests.add(socketUrl);
        await socket.close({ code: 1008, reason: "External connection blocked" });
      }
    });
    await page.goto(`${baseUrl}?render=1`, { waitUntil: "networkidle" });
    const fontAudit = await verifyRenderedFonts(page, preparedFonts);
    const renderedCount = await page.locator(".slide").count();
    if (renderedCount !== hydrated.slides.length) {
      throw new Error(`${renderedCount} slides rendues sur ${hydrated.slides.length}.`);
    }
    const missingImages = await findMissingImages(page);
    if (missingImages.length > 0) throw new Error(`Images manquantes:\n${missingImages.join("\n")}`);
    const overflow = await findOverflow(page);
    if (overflow.length > 0) {
      const details = overflow.map((item) => `${item.id} ${item.tag} largeur ${item.width}, hauteur ${item.height}`);
      throw new Error(`Overflow détecté:\n${details.join("\n")}`);
    }
    assertBrowserIntegrity(runtimeErrors, externalRequests);

    const pngPaths: string[] = [];
    for (const target of targets) {
      const pageNumber = String(target.index + 1).padStart(2, "0");
      const filename = `${pageNumber}-${safeName(target.slide.id)}.png`;
      const pngPath = join(workspace.slidesPath, filename);
      const locator = page.locator(`#slide-${pageNumber}`);
      const box = await locator.boundingBox();
      if (!box || Math.round(box.width) !== 2000 || Math.round(box.height) !== 1414) {
        throw new Error(`Dimensions invalides pour ${target.slide.id}.`);
      }
      await locator.screenshot({ animations: "disabled", caret: "hide", path: pngPath });
      pngPaths.push(pngPath);
    }
    await createDossierPdf(pngPaths, workspace.pdfPath, dossier);
    await createContactSheet(browser, pngPaths, workspace.contactSheetPath);
    await verifyPreviewWidths(page, baseUrl);
    assertBrowserIntegrity(runtimeErrors, externalRequests);
    const pageIntegrity = await Promise.all(pngPaths.map(async (pngPath, index) => ({
      file: basename(pngPath),
      sha256: await sha256File(pngPath),
      slideId: targets[index]?.slide.id ?? "",
    })));
    const integrity: RenderIntegrity = {
      pages: pageIntegrity,
      pdf: { file: basename(workspace.pdfPath), sha256: await sha256File(workspace.pdfPath) },
      source: {
        file: basename(inputPath),
        sha256: await sha256File(inputPath),
        dossierSha256: sha256(JSON.stringify(dossier)),
      },
    };
    const report = createRenderReport(
      hydrated,
      targets.map(({ slide }) => slide),
      options.slides ?? [],
      { height: A4_LANDSCAPE.height, unit: "pt", width: A4_LANDSCAPE.width },
      integrity,
      fontAudit,
    );
    const serializedReport = `${JSON.stringify(report, null, 2)}\n`;
    await writeFile(workspace.reportPath, serializedReport, "utf8");
    await writeFile(
      workspace.reportChecksumPath,
      `${sha256(serializedReport)}  render-report.json\n`,
      "utf8",
    );
    await publishRenderWorkspace(workspace);
    console.log(`Rendu: ${targets.length} PNG 2000×1414, contact-sheet.png et dossier.pdf dans ${outputPath}`);
  } finally {
    await browser?.close();
    await viteServer?.close();
    await cleanupRenderWorkspace(workspace);
  }
}

renderDossier().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
