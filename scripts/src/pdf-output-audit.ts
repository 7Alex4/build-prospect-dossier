import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import sharp from "sharp";
import { MAX_IMAGE_PIXELS, naturalCompare, round, UserInputError } from "./core.js";

const EXPECTED_PDF_WIDTH = 841.89;
const EXPECTED_PDF_HEIGHT = 595.28;
const PDF_DIMENSION_TOLERANCE = 0.2;
const MAX_PDF_BYTES = 500 * 1024 * 1024;
const CONTENT_SAMPLE_WIDTH = 256;
const CONTENT_SAMPLE_HEIGHT = 181;
const MAX_MEAN_ABSOLUTE_ERROR = 0.01;
const MAX_CHANGED_PIXEL_RATIO = 0.02;
const execFileAsync = promisify(execFile);

export interface ExpectedPdfSource {
  readonly file: string;
  readonly filePath: string;
  readonly sha256: string;
}

export interface PdfPageAudit {
  readonly page: number;
  readonly width: number;
  readonly height: number;
  readonly validA4Landscape: boolean;
  readonly sourceFile: string | null;
  readonly sourceSha256: string | null;
  readonly matchesExpectedSource: boolean;
  readonly contentMeanAbsoluteError: number | null;
  readonly contentChangedPixelRatio: number | null;
  readonly matchesExpectedContent: boolean;
}

export interface PdfAuditReport {
  readonly file: string;
  readonly bytes: number;
  readonly pageCount: number | null;
  readonly matchesImageCount: boolean;
  readonly mediaBoxesValid: boolean;
  readonly sourceLinksValid: boolean;
  readonly contentMatches: boolean;
  readonly orderMatches: boolean;
  readonly expectedMediaBox: {
    readonly width: 841.89;
    readonly height: 595.28;
    readonly tolerance: 0.2;
  };
  readonly pages: readonly PdfPageAudit[];
}

function decodedMarker(page: ReturnType<PDFDocument["getPage"]>, name: string): string | null {
  const value = page.node.get(PDFName.of(name));
  return value instanceof PDFString ? value.decodeText() : null;
}

function emptyReport(file: string, bytes: number): PdfAuditReport {
  return {
    file,
    bytes,
    pageCount: null,
    matchesImageCount: false,
    mediaBoxesValid: false,
    sourceLinksValid: false,
    contentMatches: false,
    orderMatches: false,
    expectedMediaBox: {
      width: EXPECTED_PDF_WIDTH,
      height: EXPECTED_PDF_HEIGHT,
      tolerance: PDF_DIMENSION_TOLERANCE,
    },
    pages: [],
  };
}

interface ContentComparison {
  readonly meanAbsoluteError: number;
  readonly changedPixelRatio: number;
  readonly matches: boolean;
}

async function samplePixels(filePath: string): Promise<Buffer> {
  return sharp(filePath, { limitInputPixels: MAX_IMAGE_PIXELS })
    .rotate()
    .removeAlpha()
    .toColourspace("srgb")
    .resize(CONTENT_SAMPLE_WIDTH, CONTENT_SAMPLE_HEIGHT, { fit: "fill" })
    .raw()
    .toBuffer();
}

async function comparePixels(expectedPath: string, actualPath: string): Promise<ContentComparison> {
  const [expected, actual] = await Promise.all([samplePixels(expectedPath), samplePixels(actualPath)]);
  if (expected.length !== actual.length || expected.length === 0) {
    return { meanAbsoluteError: 1, changedPixelRatio: 1, matches: false };
  }
  let absoluteDifference = 0;
  let changed = 0;
  for (let index = 0; index < expected.length; index += 1) {
    const difference = Math.abs((expected[index] ?? 0) - (actual[index] ?? 0));
    absoluteDifference += difference;
    if (difference > 24) changed += 1;
  }
  const meanAbsoluteError = absoluteDifference / (expected.length * 255);
  const changedPixelRatio = changed / expected.length;
  return {
    meanAbsoluteError,
    changedPixelRatio,
    matches: meanAbsoluteError <= MAX_MEAN_ABSOLUTE_ERROR
      && changedPixelRatio <= MAX_CHANGED_PIXEL_RATIO,
  };
}

async function compareRenderedPdf(
  pdfPath: string,
  expectedSources: readonly ExpectedPdfSource[],
): Promise<readonly ContentComparison[]> {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-pdf-images-"));
  try {
    const prefix = path.join(temporary, "page");
    const executable = process.env.PDFTOPPM_PATH?.trim() || "pdftoppm";
    await execFileAsync(executable, [
      "-png",
      "-scale-to-x", "2000",
      "-scale-to-y", "1414",
      pdfPath,
      prefix,
    ], {
      maxBuffer: 1024 * 1024,
      timeout: 60_000,
    });
    const files = (await readdir(temporary))
      .filter((file) => file.startsWith("page-") && file.endsWith(".png"))
      .sort(naturalCompare);
    const comparisons: ContentComparison[] = [];
    for (let index = 0; index < Math.min(files.length, expectedSources.length); index += 1) {
      const file = files[index];
      const expected = expectedSources[index];
      if (file !== undefined && expected !== undefined) {
        comparisons.push(await comparePixels(expected.filePath, path.join(temporary, file)));
      }
    }
    return comparisons;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export async function inspectPdfOutput(
  pdfPath: string,
  expectedSources: readonly ExpectedPdfSource[],
): Promise<{ report: PdfAuditReport; issues: readonly string[] }> {
  const resolved = path.resolve(pdfPath);
  const fileStat = await stat(resolved).catch(() => {
    throw new UserInputError(`PDF is not readable: ${pdfPath}`);
  });
  if (fileStat.size > MAX_PDF_BYTES) {
    throw new UserInputError(`PDF exceeds the ${MAX_PDF_BYTES}-byte safety limit: ${pdfPath}`);
  }
  const bytes = await readFile(resolved);
  try {
    const document = await PDFDocument.load(bytes, { updateMetadata: false });
    const count = document.getPageCount();
    let contentComparisons: readonly ContentComparison[] = [];
    let contentError: string | undefined;
    try {
      contentComparisons = await compareRenderedPdf(resolved, expectedSources);
    } catch (error) {
      contentError = error instanceof Error ? error.message : String(error);
    }
    const pages = document.getPages().map((page, index): PdfPageAudit => {
      const mediaBox = page.getMediaBox();
      const sourceFile = decodedMarker(page, "DossierSourceFile");
      const sourceSha256 = decodedMarker(page, "DossierSourceSHA256");
      const expected = expectedSources[index];
      const contentComparison = contentComparisons[index];
      return {
        page: index + 1,
        width: round(mediaBox.width, 2),
        height: round(mediaBox.height, 2),
        validA4Landscape: Math.abs(mediaBox.width - EXPECTED_PDF_WIDTH) <= PDF_DIMENSION_TOLERANCE
          && Math.abs(mediaBox.height - EXPECTED_PDF_HEIGHT) <= PDF_DIMENSION_TOLERANCE,
        sourceFile,
        sourceSha256,
        matchesExpectedSource: expected !== undefined
          && sourceFile === expected.file
          && sourceSha256 === expected.sha256,
        contentMeanAbsoluteError: contentComparison === undefined
          ? null
          : round(contentComparison.meanAbsoluteError, 6),
        contentChangedPixelRatio: contentComparison === undefined
          ? null
          : round(contentComparison.changedPixelRatio, 6),
        matchesExpectedContent: contentComparison?.matches === true,
      };
    });
    const invalidMediaBoxes = pages.filter((page) => !page.validA4Landscape);
    const invalidSourceLinks = pages.filter((page) => !page.matchesExpectedSource);
    const invalidContent = pages.filter((page) => !page.matchesExpectedContent);
    const issues: string[] = [];
    if (count !== expectedSources.length) {
      issues.push(`PDF has ${count} page(s), but ${expectedSources.length} page image(s) were found.`);
    }
    if (invalidMediaBoxes.length > 0) {
      const details = invalidMediaBoxes
        .map((page) => `${page.page} (${page.width}×${page.height} pt)`)
        .join(", ");
      issues.push(`PDF MediaBox must be A4 landscape ${EXPECTED_PDF_WIDTH}×${EXPECTED_PDF_HEIGHT} pt ±${PDF_DIMENSION_TOLERANCE}; invalid page(s): ${details}.`);
    }
    if (invalidSourceLinks.length > 0 || count !== expectedSources.length) {
      const details = invalidSourceLinks.map((page) => page.page).join(", ");
      issues.push(`PDF page order or embedded PNG linkage is invalid${details.length > 0 ? ` on page(s): ${details}` : ""}. Rebuild the PDF from the ordered final PNGs.`);
    }
    if (contentError !== undefined) {
      issues.push(`PDF visual content could not be rendered with Poppler pdftoppm: ${contentError}`);
    } else if (contentComparisons.length !== expectedSources.length || invalidContent.length > 0) {
      const details = invalidContent.map((page) => page.page).join(", ");
      issues.push(`PDF visual content does not match the ordered final PNGs${details.length > 0 ? ` on page(s): ${details}` : ""}.`);
    }
    const contentMatches = contentError === undefined
      && contentComparisons.length === expectedSources.length
      && invalidContent.length === 0;
    const sourceLinksValid = invalidSourceLinks.length === 0 && count === expectedSources.length;
    return {
      report: {
        file: path.basename(resolved),
        bytes: fileStat.size,
        pageCount: count,
        matchesImageCount: count === expectedSources.length,
        mediaBoxesValid: invalidMediaBoxes.length === 0,
        sourceLinksValid,
        contentMatches,
        orderMatches: sourceLinksValid && contentMatches,
        expectedMediaBox: {
          width: EXPECTED_PDF_WIDTH,
          height: EXPECTED_PDF_HEIGHT,
          tolerance: PDF_DIMENSION_TOLERANCE,
        },
        pages,
      },
      issues,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      report: emptyReport(path.basename(resolved), fileStat.size),
      issues: [`PDF cannot be decoded: ${detail}`],
    };
  }
}
