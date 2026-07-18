import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { inspectRenderReport } from "../src/render-report-audit.js";
import { writeCompleteRenderReport } from "./render-report-fixture.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

async function fileHash(filePath: string): Promise<string> {
  return sha256(await readFile(filePath));
}

async function writeChecksum(reportPath: string): Promise<void> {
  const checksumPath = path.join(
    path.dirname(reportPath),
    `${path.basename(reportPath, path.extname(reportPath))}.sha256`,
  );
  await writeFile(checksumPath, `${await fileHash(reportPath)}  ${path.basename(reportPath)}\n`, "utf8");
}

test("render report audit rejects a checksum-valid minimal report", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "render-report-minimal-"));
  context.after(async () => rm(temporary, { force: true, recursive: true }));
  const reportPath = path.join(temporary, "render-report.json");
  await writeFile(reportPath, `${JSON.stringify({
    schemaVersion: "1.0",
    stage: "final",
    totalSlides: 0,
    renderedCount: 0,
    selectionApplied: false,
    selection: [],
    renderedSlideIds: [],
  })}\n`, "utf8");
  await writeChecksum(reportPath);

  const inspection = await inspectRenderReport(reportPath, []);

  assert.equal(inspection.report.checksumValid, true);
  assert.equal(inspection.report.fullFinalRender, false);
  assert.match(inspection.issues.join(" "), /evidenceRegistry/);
  assert.match(inspection.issues.join(" "), /integrity block/);
});

test("render report audit binds PNG, PDF and report hashes", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "render-report-hashes-"));
  context.after(async () => rm(temporary, { force: true, recursive: true }));
  const pagePath = path.join(temporary, "01-cover.png");
  const pdfPath = path.join(temporary, "dossier.pdf");
  const reportPath = path.join(temporary, "render-report.json");
  await writeFile(pagePath, "page-v1");
  await writeFile(pdfPath, "pdf-v1");
  await writeCompleteRenderReport(reportPath, pdfPath, [pagePath], ["cover"]);

  const valid = await inspectRenderReport(
    reportPath,
    [{ file: path.basename(pagePath), sha256: await fileHash(pagePath) }],
    pdfPath,
  );
  assert.equal(valid.report.fullFinalRender, true, valid.issues.join("\n"));

  await appendFile(pagePath, "-tampered");
  const pageTamper = await inspectRenderReport(
    reportPath,
    [{ file: path.basename(pagePath), sha256: await fileHash(pagePath) }],
    pdfPath,
  );
  assert.match(pageTamper.issues.join(" "), /PNG integrity mismatch/);

  await appendFile(pdfPath, "-tampered");
  const pdfTamper = await inspectRenderReport(
    reportPath,
    [{ file: path.basename(pagePath), sha256: await fileHash(pagePath) }],
    pdfPath,
  );
  assert.match(pdfTamper.issues.join(" "), /PDF hash does not match/);

  await appendFile(reportPath, "\n");
  const reportTamper = await inspectRenderReport(
    reportPath,
    [{ file: path.basename(pagePath), sha256: await fileHash(pagePath) }],
    pdfPath,
  );
  assert.equal(reportTamper.report.checksumValid, false);
  assert.match(reportTamper.issues.join(" "), /checksum/);
});

test("render report audit rejects internal-only evidence even with a valid checksum", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "render-report-private-evidence-"));
  context.after(async () => rm(temporary, { force: true, recursive: true }));
  const pagePath = path.join(temporary, "01-cover.png");
  const pdfPath = path.join(temporary, "dossier.pdf");
  const reportPath = path.join(temporary, "render-report.json");
  await writeFile(pagePath, "page");
  await writeFile(pdfPath, "pdf");
  await writeCompleteRenderReport(reportPath, pdfPath, [pagePath], ["cover"]);
  const parsed: unknown = JSON.parse(await readFile(reportPath, "utf8"));
  assert.ok(isRecord(parsed) && Array.isArray(parsed.traceability));
  parsed.evidenceRegistry = [
    { id: "private:note", kind: "proposal", status: "internal-only", claim: "Note privée" },
  ];
  const trace = parsed.traceability[0];
  assert.ok(isRecord(trace));
  trace.evidenceIds = ["private:note"];
  await writeFile(reportPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  await writeChecksum(reportPath);

  const inspection = await inspectRenderReport(
    reportPath,
    [{ file: path.basename(pagePath), sha256: await fileHash(pagePath) }],
    pdfPath,
  );

  assert.equal(inspection.report.checksumValid, true);
  assert.equal(inspection.report.fullFinalRender, false);
  assert.match(inspection.issues.join(" "), /internal-only evidence/);
});

test("render report audit recrosses asset rights, scope and origin with governance", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "render-report-assets-"));
  context.after(async () => rm(temporary, { force: true, recursive: true }));
  const pagePath = path.join(temporary, "01-cover.png");
  const pdfPath = path.join(temporary, "dossier.pdf");
  const reportPath = path.join(temporary, "render-report.json");
  await writeFile(pagePath, "page");
  await writeFile(pdfPath, "pdf");
  await writeCompleteRenderReport(reportPath, pdfPath, [pagePath], ["cover"]);
  const parsed: unknown = JSON.parse(await readFile(reportPath, "utf8"));
  assert.ok(isRecord(parsed) && Array.isArray(parsed.traceability));
  parsed.assetRegistry = [{
    id: "asset:hero",
    origin: "provided",
    rightsBasis: "Fixture rights",
    status: "approved",
    allowedDistributionScopes: ["private-prospecting"],
    sourceIdentity: { kind: "local-src", sha256: sha256("fixture") },
  }];
  const trace = parsed.traceability[0];
  assert.ok(isRecord(trace));
  trace.assetIds = ["asset:hero"];

  const inspectMutation = async (mutate: (asset: UnknownRecord) => void) => {
    const report = structuredClone(parsed);
    assert.ok(isRecord(report) && Array.isArray(report.assetRegistry) && isRecord(report.assetRegistry[0]));
    mutate(report.assetRegistry[0]);
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeChecksum(reportPath);
    return inspectRenderReport(
      reportPath,
      [{ file: path.basename(pagePath), sha256: await fileHash(pagePath) }],
      pdfPath,
    );
  };

  const valid = await inspectMutation(() => undefined);
  assert.equal(valid.report.fullFinalRender, true, valid.issues.join("\n"));
  const rights = await inspectMutation((asset) => { asset.status = "unknown"; });
  assert.match(rights.issues.join(" "), /status must be approved/);
  const scope = await inspectMutation((asset) => { asset.allowedDistributionScopes = ["public"]; });
  assert.match(scope.issues.join(" "), /not cleared for private-prospecting/);
  const origin = await inspectMutation((asset) => { asset.origin = "generated"; });
  assert.match(origin.issues.join(" "), /violates the generative asset policy/);
});

test("render report audit requires the explicit generative authorization trace", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "render-report-generative-auth-"));
  context.after(async () => rm(temporary, { force: true, recursive: true }));
  const pagePath = path.join(temporary, "01-cover.png");
  const pdfPath = path.join(temporary, "dossier.pdf");
  const reportPath = path.join(temporary, "render-report.json");
  await writeFile(pagePath, "page");
  await writeFile(pdfPath, "pdf");
  await writeCompleteRenderReport(reportPath, pdfPath, [pagePath], ["cover"]);
  const parsed: unknown = JSON.parse(await readFile(reportPath, "utf8"));
  assert.ok(isRecord(parsed) && Array.isArray(parsed.traceability) && isRecord(parsed.governance));
  parsed.governance.generativeAssets = "authorized";
  delete parsed.governance.generativeAssetsAuthorization;
  parsed.assetRegistry = [{
    id: "asset:generated-scene",
    origin: "generated",
    rightsBasis: "Explicit user authorization",
    status: "approved",
    allowedDistributionScopes: ["private-prospecting"],
    sourceIdentity: { kind: "data-uri", sha256: sha256("scene") },
  }];
  const trace = parsed.traceability[0];
  assert.ok(isRecord(trace));
  trace.assetIds = ["asset:generated-scene"];

  const inspect = async (report: UnknownRecord) => {
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeChecksum(reportPath);
    return inspectRenderReport(
      reportPath,
      [{ file: path.basename(pagePath), sha256: await fileHash(pagePath) }],
      pdfPath,
    );
  };
  const missing = await inspect(parsed);
  assert.match(missing.issues.join(" "), /generative authorization must contain/);
  assert.match(missing.issues.join(" "), /violates the generative asset policy/);

  const authorized = structuredClone(parsed);
  assert.ok(isRecord(authorized) && isRecord(authorized.governance));
  authorized.governance.generativeAssetsAuthorization = {
    status: "explicitly-authorized",
    authorizedBy: "Fixture owner",
    reference: "fixture:owner-brief#visuals",
  };
  const valid = await inspect(authorized);
  assert.equal(valid.report.fullFinalRender, true, valid.issues.join("\n"));
});

test("render report audit rejects a tampered font contract and resolved fallback", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "render-report-fonts-"));
  context.after(async () => rm(temporary, { force: true, recursive: true }));
  const pagePath = path.join(temporary, "01-cover.png");
  const pdfPath = path.join(temporary, "dossier.pdf");
  const reportPath = path.join(temporary, "render-report.json");
  await writeFile(pagePath, "page");
  await writeFile(pdfPath, "pdf");
  await writeCompleteRenderReport(reportPath, pdfPath, [pagePath], ["cover"]);
  const parsed: unknown = JSON.parse(await readFile(reportPath, "utf8"));
  assert.ok(isRecord(parsed) && isRecord(parsed.fontAudit)
    && Array.isArray(parsed.fontAudit.contract) && isRecord(parsed.fontAudit.contract[0])
    && Array.isArray(parsed.fontAudit.faces) && isRecord(parsed.fontAudit.faces[0]));

  parsed.fontAudit.contract[0].family = "Fallback interdit";
  parsed.fontAudit.faces[0].resolvedFamily = "Fallback interdit";
  await writeFile(reportPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  await writeChecksum(reportPath);
  const inspection = await inspectRenderReport(
    reportPath,
    [{ file: path.basename(pagePath), sha256: await fileHash(pagePath) }],
    pdfPath,
  );

  assert.equal(inspection.report.fullFinalRender, false);
  assert.match(inspection.issues.join(" "), /font contract hash does not match/);
  assert.match(inspection.issues.join(" "), /font audit contains undeclared face/);
});
