import { rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Browser } from "playwright";

export const CONTACT_SHEET_COLUMNS = 4;
export const CONTACT_SHEET_CELL_WIDTH = 400;
export const CONTACT_SHEET_CELL_HEIGHT = 283;

export interface ContactSheetLayout {
  readonly columns: number;
  readonly rows: number;
  readonly width: number;
  readonly height: number;
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

export function contactSheetLayout(imageCount: number): ContactSheetLayout {
  if (!Number.isSafeInteger(imageCount) || imageCount <= 0) {
    throw new Error("Une planche contact exige au moins une image.");
  }
  const columns = Math.min(CONTACT_SHEET_COLUMNS, imageCount);
  const rows = Math.ceil(imageCount / columns);
  return {
    columns,
    rows,
    width: columns * CONTACT_SHEET_CELL_WIDTH,
    height: rows * CONTACT_SHEET_CELL_HEIGHT,
  };
}

function contactSheetHtml(pngPaths: readonly string[], layout: ContactSheetLayout): string {
  const images = pngPaths.map((pngPath) => {
    const source = escapeAttribute(pathToFileURL(resolve(pngPath)).href);
    return `<img src="${source}" alt="">`;
  }).join("");
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
* { box-sizing: border-box; }
html, body { margin: 0; width: ${layout.width}px; height: ${layout.height}px; overflow: hidden; background: #fff; }
main { display: grid; grid-template-columns: repeat(${layout.columns}, ${CONTACT_SHEET_CELL_WIDTH}px); grid-auto-rows: ${CONTACT_SHEET_CELL_HEIGHT}px; width: 100%; height: 100%; align-content: start; justify-content: start; }
img { display: block; width: ${CONTACT_SHEET_CELL_WIDTH}px; height: ${CONTACT_SHEET_CELL_HEIGHT}px; object-fit: fill; }
</style>
</head>
<body><main>${images}</main></body>
</html>`;
}

export async function createContactSheet(
  browser: Browser,
  pngPaths: readonly string[],
  outputPath: string,
): Promise<void> {
  const layout = contactSheetLayout(pngPaths.length);
  const sourcePath = join(dirname(outputPath), ".contact-sheet-source.html");
  await writeFile(sourcePath, contactSheetHtml(pngPaths, layout), "utf8");
  const page = await browser.newPage({
    colorScheme: "light",
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    viewport: { height: layout.height, width: layout.width },
  });
  try {
    await page.goto(pathToFileURL(sourcePath).href, { waitUntil: "load" });
    const invalidImages = await page.locator("img").evaluateAll(async (images) => {
      const htmlImages = images.map((image) => {
        if (!(image instanceof HTMLImageElement)) throw new Error("Élément image inattendu.");
        return image;
      });
      await Promise.all(htmlImages.map((image) => image.decode().catch(() => undefined)));
      return htmlImages.flatMap((image, index) => image.complete && image.naturalWidth > 0 ? [] : [index + 1]);
    });
    if (invalidImages.length > 0) {
      throw new Error(`PNG illisibles dans la planche contact: ${invalidImages.join(", ")}.`);
    }
    await page.screenshot({
      animations: "disabled",
      caret: "hide",
      omitBackground: false,
      path: outputPath,
      scale: "css",
      type: "png",
    });
  } finally {
    await page.close();
    await rm(sourcePath, { force: true });
  }
}
