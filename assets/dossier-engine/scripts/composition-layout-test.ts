import assert from "node:assert/strict";
import { createServer as createNetServer } from "node:net";
import { resolve } from "node:path";
import { chromium, type Locator } from "playwright";
import { createServer as createViteServer } from "vite";
import { blackFlowerValidationFixture } from "../src/content/black-flower-validation-fixture";
import { blackFlowerCompositionBindings } from "../src/schema/black-flower-content-validation";

interface Rect {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

async function openPort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createNetServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (typeof address === "string" || address === null) {
        server.close();
        reject(new Error("Impossible d'allouer un port local pour le test de composition."));
        return;
      }
      server.close((error) => error ? reject(error) : resolvePort(address.port));
    });
  });
}

async function signature(slide: Locator, family?: string): Promise<readonly Rect[]> {
  return slide.evaluate((node, activeFamily) => {
    [...node.classList]
      .filter((name) => name.startsWith("slide--composition-"))
      .forEach((name) => node.classList.remove(name));
    if (activeFamily) node.classList.add(`slide--composition-${activeFamily}`);
    return [...node.querySelectorAll<HTMLElement>("*")].map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        height: Math.round(rect.height * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        x: Math.round(rect.x * 10) / 10,
        y: Math.round(rect.y * 10) / 10,
      };
    });
  }, family);
}

function differs(left: readonly Rect[], right: readonly Rect[]): boolean {
  return left.length === right.length && left.some((entry, index) => {
    const other = right[index];
    return other !== undefined && (
      Math.abs(entry.x - other.x) >= .5
      || Math.abs(entry.y - other.y) >= .5
      || Math.abs(entry.width - other.width) >= .5
      || Math.abs(entry.height - other.height) >= .5
    );
  });
}

const byType = new Map<string, string[]>();
Object.entries(blackFlowerCompositionBindings).forEach(([family, types]) => {
  types.forEach((type) => byType.set(type, [...(byType.get(type) ?? []), family]));
});

const port = await openPort();
const server = await createViteServer({
  configFile: resolve("vite.config.ts"),
  logLevel: "error",
  server: { host: "127.0.0.1", port, strictPort: true },
});
const browser = await chromium.launch({ headless: true });
try {
  await server.listen();
  const page = await browser.newPage({ viewport: { height: 1478, width: 2064 } });
  await page.addInitScript((payload: unknown) => { window.__DOSSIER_DATA__ = payload; }, blackFlowerValidationFixture);
  await page.goto(`http://127.0.0.1:${port}/?render=1`, { waitUntil: "networkidle" });
  await page.evaluate(async () => { await document.fonts.ready; });

  const exercised = new Set<string>();
  for (const [type, families] of byType) {
    const slide = page.locator(`.slide-type--${type}`).first();
    assert.equal(await slide.count(), 1, `Slide de test absente pour ${type}.`);
    const baseline = await signature(slide);
    const variants: Array<{ family: string; rects: readonly Rect[] }> = [];
    for (const family of families) {
      const rects = await signature(slide, family);
      assert.ok(differs(baseline, rects), `${family}/${type} ne modifie aucune bounding box.`);
      variants.forEach((other) => {
        assert.ok(differs(other.rects, rects), `${family}/${type} reproduit la géométrie ${other.family}/${type}.`);
      });
      variants.push({ family, rects });
      exercised.add(family);
    }
  }
  assert.deepEqual(
    [...exercised].sort(),
    Object.keys(blackFlowerCompositionBindings).sort(),
    "Chaque famille doit être prouvée dans Chromium.",
  );
} finally {
  await browser.close();
  await server.close();
}

console.log("Tests compositions: chaque couple autorisé modifie des bounding boxes dans Chromium.");
