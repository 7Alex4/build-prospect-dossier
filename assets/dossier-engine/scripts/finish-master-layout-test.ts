import assert from "node:assert/strict";
import { createServer as createNetServer } from "node:net";
import { resolve } from "node:path";
import { chromium, type Locator } from "playwright";
import { createServer as createViteServer } from "vite";
import { blackFlowerValidationFixture } from "../src/content/black-flower-validation-fixture";

interface Rect {
  readonly bottom: number;
  readonly height: number;
  readonly right: number;
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
        reject(new Error("Impossible d'allouer un port pour le test des masters."));
        return;
      }
      server.close((error) => error ? reject(error) : resolvePort(address.port));
    });
  });
}

async function relativeRect(slide: Locator, target: Locator): Promise<Rect> {
  const parent = await slide.boundingBox();
  const child = await target.boundingBox();
  if (!parent || !child) throw new Error("Bounding box absente.");
  const x = child.x - parent.x;
  const y = child.y - parent.y;
  return {
    bottom: y + child.height,
    height: child.height,
    right: x + child.width,
    width: child.width,
    x,
    y,
  };
}

function between(value: number, min: number, max: number, label: string): void {
  assert.ok(value >= min && value <= max, `${label}: ${value.toFixed(1)} hors ${min}–${max}.`);
}

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

  const production = page.locator('[data-slide-id="15-production"]');
  const productionTitle = await relativeRect(production, production.locator(".production-portrait-heading h1"));
  const productionLead = await relativeRect(production, production.locator(".production-portrait-heading p"));
  const productionRole = await relativeRect(production, production.locator(".production-portrait-copy section").first());
  const productionImage = await relativeRect(production, production.locator(".production-portrait-image"));
  between(productionTitle.x, 132, 152, "Production title x");
  between(productionTitle.y, 210, 245, "Production title y");
  between(productionLead.height, 24, 48, "Production tagline single-line height");
  between(productionImage.x, 1120, 1160, "Production portrait x");
  between(productionImage.y, 438, 478, "Production portrait y");
  between(productionImage.width, 580, 620, "Production portrait width");
  between(productionImage.height, 740, 780, "Production portrait height");
  assert.ok(Math.abs(productionRole.y - productionImage.y) <= 24, "Notre rôle doit commencer au niveau du portrait.");
  assert.equal(await production.locator(".workstreams, .deliverables, .constraints, .index-label").count(), 0);
  assert.equal(await production.locator(".production-portrait-image figcaption").count(), 0);
  assert.equal(await production.locator(".production-portrait-image img").evaluate((node) => getComputedStyle(node).objectFit), "contain");

  const thanks = page.locator('[data-slide-id="17-merci"]');
  const thanksTitle = await relativeRect(thanks, thanks.locator(".thankyou-letter-master h1"));
  const thanksFirstParagraph = await relativeRect(thanks, thanks.locator(".thankyou-letter-copy > p").first());
  const thanksSignature = await relativeRect(thanks, thanks.locator(".thankyou-letter-signature"));
  const thanksObject = await relativeRect(thanks, thanks.locator(".thankyou-letter-object"));
  between(thanksTitle.x, 132, 152, "Merci title x");
  between(thanksTitle.y, 208, 245, "Merci title y");
  between(thanksFirstParagraph.y, 295, 420, "Merci letter y");
  between(thanksSignature.x, 125, 155, "Merci signature x");
  between(thanksSignature.y, 1060, 1215, "Merci signature y");
  between(thanksObject.x, 1080, 1280, "Merci object x");
  assert.equal(await thanks.locator(".thankyou-letter-copy > p").count(), 4);
  assert.equal(await thanks.locator(".eyebrow, .contact-card, .thankyou-main").count(), 0);
  assert.equal((await thanks.locator("h1").innerText()).trim(), "MERCI");

  const lockup = page.locator('[data-slide-id="18-signature"]');
  const cluster = await relativeRect(lockup, lockup.locator(".lockup-co-mark__group"));
  const clientMark = await relativeRect(lockup, lockup.locator(".lockup-co-mark__client"));
  const studioMark = await relativeRect(lockup, lockup.locator(".lockup-co-mark__studio"));
  between(cluster.width, 220, 380, "Lockup group width");
  between(cluster.y + cluster.height / 2, 687, 727, "Lockup center y");
  assert.ok(clientMark.x < studioMark.x, "Le logo prospect doit précéder la fleur Black Flower.");
  assert.equal(await lockup.locator(".asset").count(), 2);
  assert.equal(await lockup.locator(".slide__running-header, .slide__footer, .chapter-mark").count(), 0);
  assert.equal((await lockup.innerText()).trim(), "×");
  const coverColor = await page.locator('[data-slide-id="01-ouverture"]').evaluate((node) => getComputedStyle(node).backgroundColor);
  const lockupColor = await lockup.evaluate((node) => getComputedStyle(node).backgroundColor);
  assert.equal(lockupColor, coverColor, "Le lockup doit reprendre le champ profond de la couverture.");
} finally {
  await browser.close();
  await server.close();
}

console.log("Tests masters: Production, Merci et lockup conformes aux géométries Black Flower.");
