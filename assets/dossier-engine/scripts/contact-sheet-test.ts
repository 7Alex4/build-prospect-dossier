import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { join } from "node:path";
import { chromium, type Browser } from "playwright";
import { contactSheetLayout, createContactSheet } from "./lib/contact-sheet";

const redPixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const bluePixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlWl9sAAAAASUVORK5CYII=",
  "base64",
);

function pngDimensions(png: Buffer): { readonly height: number; readonly width: number } {
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return { height: png.readUInt32BE(20), width: png.readUInt32BE(16) };
}

assert.deepEqual(contactSheetLayout(20), { columns: 4, rows: 5, width: 1600, height: 1415 });
assert.deepEqual(contactSheetLayout(5), { columns: 4, rows: 2, width: 1600, height: 566 });
assert.deepEqual(contactSheetLayout(3), { columns: 3, rows: 1, width: 1200, height: 283 });
assert.throws(() => contactSheetLayout(0), /au moins une image/);

const temporary = await mkdtemp(join(os.tmpdir(), "dossier-contact-sheet-"));
let browser: Browser | undefined;
try {
  const redPath = join(temporary, "red.png");
  const bluePath = join(temporary, "blue.png");
  const outputPath = join(temporary, "contact-sheet.png");
  const repeatedPath = join(temporary, "contact-sheet-repeated.png");
  const partialPath = join(temporary, "contact-sheet-partial.png");
  await Promise.all([writeFile(redPath, redPixel), writeFile(bluePath, bluePixel)]);
  browser = await chromium.launch({ headless: true });

  const originalSequence = Array.from({ length: 20 }, () => redPath);
  await createContactSheet(browser, originalSequence, outputPath);
  const staleSheet = await readFile(outputPath);

  const refreshedSequence = [bluePath, ...originalSequence.slice(1)];
  await createContactSheet(browser, refreshedSequence, outputPath);
  const refreshedSheet = await readFile(outputPath);
  assert.notDeepEqual(refreshedSheet, staleSheet);
  assert.deepEqual(pngDimensions(refreshedSheet), { height: 1415, width: 1600 });

  await createContactSheet(browser, refreshedSequence, repeatedPath);
  assert.deepEqual(await readFile(repeatedPath), refreshedSheet);

  await createContactSheet(browser, refreshedSequence.slice(0, 5), partialPath);
  assert.deepEqual(pngDimensions(await readFile(partialPath)), { height: 566, width: 1600 });
} finally {
  await browser?.close();
  await rm(temporary, { force: true, recursive: true });
}

console.log("Tests planche contact: dimensions, sélection, rafraîchissement et déterminisme validés.");
