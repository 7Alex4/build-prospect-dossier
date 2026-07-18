import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import sharp from "sharp";
import { auditOutput } from "../src/output-audit.js";
import { writeCompleteRenderReport } from "./render-report-fixture.js";

async function makePage(filePath: string, width = 2000, height = 1414): Promise<void> {
  await sharp({ create: { width, height, channels: 3, background: "#dedbd3" } })
    .png()
    .toFile(filePath);
}

async function makeLinkedPdf(
  filePath: string,
  sourcePaths: readonly string[],
  mediaBox: [number, number] = [841.89, 595.28],
  markerPaths: readonly string[] = sourcePaths,
): Promise<void> {
  const document = await PDFDocument.create();
  for (let index = 0; index < sourcePaths.length; index += 1) {
    const sourcePath = sourcePaths[index];
    const markerPath = markerPaths[index];
    assert.ok(sourcePath !== undefined && markerPath !== undefined);
    const bytes = await readFile(sourcePath);
    const markerBytes = await readFile(markerPath);
    const image = await document.embedPng(bytes);
    const page = document.addPage(mediaBox);
    page.node.set(
      PDFName.of("DossierSourceSHA256"),
      PDFString.of(createHash("sha256").update(markerBytes).digest("hex")),
    );
    page.node.set(PDFName.of("DossierSourceFile"), PDFString.of(path.basename(markerPath)));
    page.drawImage(image, { x: 0, y: 0, width: mediaBox[0], height: mediaBox[1] });
  }
  await writeFile(filePath, await document.save({ useObjectStreams: false }));
  const renderedSlideIds = markerPaths.map((markerPath) =>
    path.basename(markerPath, path.extname(markerPath)).replace(/^\d+(?:[-_ .])/, ""),
  );
  await writeCompleteRenderReport(
    path.join(path.dirname(filePath), "render-report.json"),
    filePath,
    markerPaths,
    renderedSlideIds,
  );
}

test("output audit validates page dimensions, numbering and PDF count", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-output-audit-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const pages = path.join(temporary, "slides");
  const output = path.join(temporary, "qa");
  await mkdir(pages, { recursive: true });
  await Promise.all([
    makePage(path.join(pages, "01-cover.png")),
    makePage(path.join(pages, "02-close.png")),
  ]);
  const pdfPath = path.join(temporary, "dossier.pdf");
  await makeLinkedPdf(pdfPath, [
    path.join(pages, "01-cover.png"),
    path.join(pages, "02-close.png"),
  ]);

  const report = await auditOutput({ pagesDirectory: pages, outputDirectory: output, pdfPath });

  assert.equal(report.status, "pass", report.issues.join("\n"));
  assert.equal(report.pageCount, 2);
  assert.deepEqual(report.expected, {
    width: 2000,
    height: 1414,
    firstPage: 1,
    format: "png",
    colorSpace: "srgb",
    hasAlpha: false,
  });
  assert.equal(report.pdf?.pageCount, 2);
  assert.equal(report.pdf?.mediaBoxesValid, true);
  assert.equal(report.pdf?.sourceLinksValid, true);
  assert.equal(report.pdf?.orderMatches, true);
  assert.match(report.pages[0]?.sha256 ?? "", /^[0-9a-f]{64}$/);
  assert.equal(report.pages[0]?.format, "png");
  assert.equal(report.pages[0]?.colorSpace, "srgb");
  assert.equal(report.pages[0]?.channels, 3);
  assert.equal(report.pages[0]?.hasAlpha, false);
  assert.deepEqual(report.pdf?.pages.map((page) => [page.width, page.height]), [
    [841.89, 595.28],
    [841.89, 595.28],
  ]);
  assert.ok((await stat(path.join(output, "audit.json"))).size > 0);
  assert.ok((await stat(path.join(output, "contact-sheet.png"))).size > 0);
});

test("output audit rejects permuted PDF visuals even when page markers are spoofed", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-output-pdf-spoof-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const pages = path.join(temporary, "slides");
  await mkdir(pages, { recursive: true });
  const first = path.join(pages, "01-cover.png");
  const second = path.join(pages, "02-close.png");
  await makePage(first);
  await sharp({ create: { width: 2000, height: 1414, channels: 3, background: "#202730" } })
    .png()
    .toFile(second);
  const pdfPath = path.join(temporary, "spoofed.pdf");
  await makeLinkedPdf(pdfPath, [second, first], [841.89, 595.28], [first, second]);

  const report = await auditOutput({
    pagesDirectory: pages,
    outputDirectory: path.join(temporary, "qa"),
    pdfPath,
  });

  assert.equal(report.status, "fail");
  assert.equal(report.pdf?.sourceLinksValid, true);
  assert.equal(report.pdf?.contentMatches, false);
  assert.equal(report.pdf?.orderMatches, false);
  assert.match(report.issues.join(" "), /visual content does not match/);
});

test("output audit rejects a draft or partial render report", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-output-report-partial-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const pages = path.join(temporary, "slides");
  await mkdir(pages, { recursive: true });
  const first = path.join(pages, "01-cover.png");
  await makePage(first);
  const pdfPath = path.join(temporary, "dossier.pdf");
  await makeLinkedPdf(pdfPath, [first]);
  await writeFile(path.join(temporary, "render-report.json"), `${JSON.stringify({
    schemaVersion: "1.0",
    stage: "draft",
    totalSlides: 2,
    renderedCount: 1,
    selectionApplied: true,
    selection: ["1"],
    renderedSlideIds: ["cover"],
  })}\n`, "utf8");

  const report = await auditOutput({
    pagesDirectory: pages,
    outputDirectory: path.join(temporary, "qa"),
    pdfPath,
  });

  assert.equal(report.status, "fail");
  assert.equal(report.renderReport?.fullFinalRender, false);
  assert.match(report.issues.join(" "), /stage must be final/);
  assert.match(report.issues.join(" "), /full render/);
});

test("output audit rejects a PDF without its sibling render report", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-output-report-missing-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const pages = path.join(temporary, "slides");
  await mkdir(pages, { recursive: true });
  const first = path.join(pages, "01-cover.png");
  await makePage(first);
  const pdfPath = path.join(temporary, "dossier.pdf");
  await makeLinkedPdf(pdfPath, [first]);
  await rm(path.join(temporary, "render-report.json"));

  const report = await auditOutput({
    pagesDirectory: pages,
    outputDirectory: path.join(temporary, "qa"),
    pdfPath,
  });

  assert.equal(report.status, "fail");
  assert.equal(report.renderReport, null);
  assert.match(report.issues.join(" "), /Render report is not readable/);
});

test("output audit reports gaps and wrong dimensions", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-output-fail-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const pages = path.join(temporary, "slides");
  await mkdir(pages, { recursive: true });
  await makePage(path.join(pages, "01-cover.png"));
  await makePage(path.join(pages, "03-gap.png"), 100, 100);

  const report = await auditOutput({ pagesDirectory: pages, outputDirectory: path.join(temporary, "qa") });

  assert.equal(report.status, "fail");
  assert.match(report.issues.join(" "), /contiguous/);
  assert.match(report.issues.join(" "), /Expected 2000×1414/);
});

test("output audit rejects JPEG, WebP, alpha and non-sRGB final pages", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-output-contract-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const pages = path.join(temporary, "slides");
  await mkdir(pages, { recursive: true });
  await sharp({ create: { width: 2000, height: 1414, channels: 3, background: "#dedbd3" } })
    .jpeg({ quality: 80 })
    .toFile(path.join(pages, "01-jpeg.jpg"));
  await sharp({ create: { width: 2000, height: 1414, channels: 3, background: "#dedbd3" } })
    .webp({ quality: 80 })
    .toFile(path.join(pages, "02-webp.webp"));
  await sharp({ create: { width: 2000, height: 1414, channels: 4, background: "#dedbd3ff" } })
    .png()
    .toFile(path.join(pages, "03-alpha.png"));
  await sharp({ create: { width: 2000, height: 1414, channels: 3, background: "#dedbd3" } })
    .grayscale()
    .toColourspace("b-w")
    .png()
    .toFile(path.join(pages, "04-gray.png"));

  const report = await auditOutput({ pagesDirectory: pages, outputDirectory: path.join(temporary, "qa") });

  assert.equal(report.status, "fail");
  assert.equal(report.pages[0]?.format, "jpeg");
  assert.equal(report.pages[1]?.format, "webp");
  assert.equal(report.pages[2]?.format, "png");
  assert.equal(report.pages[2]?.hasAlpha, true);
  assert.equal(report.pages[2]?.channels, 4);
  assert.equal(report.pages[3]?.colorSpace, "b-w");
  assert.match(report.issues.join(" "), /format must be PNG, found jpeg/);
  assert.match(report.issues.join(" "), /format must be PNG, found webp/);
  assert.match(report.issues.join(" "), /must not contain an alpha channel/);
  assert.match(report.issues.join(" "), /colour space must be sRGB, found b-w/);
});

test("output audit rejects a PDF whose MediaBox is not A4 landscape", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-output-pdf-size-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const pages = path.join(temporary, "slides");
  await mkdir(pages, { recursive: true });
  await makePage(path.join(pages, "01-cover.png"));
  const pdfPath = path.join(temporary, "wrong-size.pdf");
  await makeLinkedPdf(pdfPath, [path.join(pages, "01-cover.png")], [2000, 1414]);

  const report = await auditOutput({
    pagesDirectory: pages,
    outputDirectory: path.join(temporary, "qa"),
    pdfPath,
  });

  assert.equal(report.status, "fail");
  assert.equal(report.pdf?.mediaBoxesValid, false);
  assert.equal(report.pdf?.pages[0]?.page, 1);
  assert.equal(report.pdf?.pages[0]?.width, 2000);
  assert.equal(report.pdf?.pages[0]?.height, 1414);
  assert.equal(report.pdf?.pages[0]?.validA4Landscape, false);
  assert.equal(report.pdf?.pages[0]?.matchesExpectedSource, true);
  assert.match(report.issues.join(" "), /MediaBox must be A4 landscape/);
});

test("output audit rejects a PDF whose linked PNG pages are permuted", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-output-pdf-order-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const pages = path.join(temporary, "slides");
  await mkdir(pages, { recursive: true });
  const first = path.join(pages, "01-cover.png");
  const second = path.join(pages, "02-close.png");
  await makePage(first);
  await sharp({ create: { width: 2000, height: 1414, channels: 3, background: "#202730" } })
    .png()
    .toFile(second);
  const pdfPath = path.join(temporary, "permuted.pdf");
  await makeLinkedPdf(pdfPath, [second, first]);

  const report = await auditOutput({
    pagesDirectory: pages,
    outputDirectory: path.join(temporary, "qa"),
    pdfPath,
  });

  assert.equal(report.status, "fail");
  assert.equal(report.pdf?.matchesImageCount, true);
  assert.equal(report.pdf?.mediaBoxesValid, true);
  assert.equal(report.pdf?.sourceLinksValid, false);
  assert.equal(report.pdf?.orderMatches, false);
  assert.match(report.issues.join(" "), /page order or embedded PNG linkage is invalid/);
});
