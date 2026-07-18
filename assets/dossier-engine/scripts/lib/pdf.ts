import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import type { Dossier } from "../../src/schema/types";

export const A4_LANDSCAPE = {
  height: 595.28,
  width: 841.89,
} as const;

export interface ImagePlacement {
  height: number;
  width: number;
  x: number;
  y: number;
}

export function fitWithinA4(imageWidth: number, imageHeight: number): ImagePlacement {
  const scale = Math.min(A4_LANDSCAPE.width / imageWidth, A4_LANDSCAPE.height / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    height,
    width,
    x: (A4_LANDSCAPE.width - width) / 2,
    y: (A4_LANDSCAPE.height - height) / 2,
  };
}

export async function createDossierPdf(
  pngPaths: readonly string[],
  outputPath: string,
  dossier: Dossier,
): Promise<void> {
  const pdf = await PDFDocument.create({ updateMetadata: false });
  pdf.setTitle(dossier.meta.title);
  if (dossier.meta.studio) pdf.setAuthor(dossier.meta.studio);
  pdf.setSubject(`Dossier pour ${dossier.meta.client}`);
  pdf.setCreator("Prospect Dossier Engine");
  pdf.setProducer("Prospect Dossier Engine");
  const fixedDate = new Date("2000-01-01T00:00:00.000Z");
  pdf.setCreationDate(fixedDate);
  pdf.setModificationDate(fixedDate);
  for (const pngPath of pngPaths) {
    const pngBytes = await readFile(pngPath);
    const image = await pdf.embedPng(pngBytes);
    const placement = fitWithinA4(image.width, image.height);
    const page = pdf.addPage([A4_LANDSCAPE.width, A4_LANDSCAPE.height]);
    const sourceHash = createHash("sha256").update(pngBytes).digest("hex");
    page.node.set(PDFName.of("DossierSourceSHA256"), PDFString.of(sourceHash));
    page.node.set(PDFName.of("DossierSourceFile"), PDFString.of(basename(pngPath)));
    page.drawImage(image, placement);
  }
  await writeFile(outputPath, await pdf.save({ useObjectStreams: false }));
}
