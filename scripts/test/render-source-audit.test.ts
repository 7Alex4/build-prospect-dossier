import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { inspectRenderReport } from "../src/render-report-audit.js";
import { inspectRenderSource } from "../src/render-source-audit.js";
import { writeCompleteRenderReport } from "./render-report-fixture.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

async function checksum(reportPath: string): Promise<void> {
  const serialized = await readFile(reportPath);
  await writeFile(
    path.join(path.dirname(reportPath), "render-report.sha256"),
    `${sha256(serialized)}  render-report.json\n`,
    "utf8",
  );
}

test("render report audit recomputes source and loaded dossier hashes", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "render-source-audit-"));
  context.after(async () => rm(temporary, { force: true, recursive: true }));
  const pagePath = path.join(temporary, "01-cover.png");
  const pdfPath = path.join(temporary, "dossier.pdf");
  const reportPath = path.join(temporary, "render-report.json");
  const sourcePath = path.join(temporary, "deck.json");
  const source = { meta: { title: "Fixture" }, slides: [{ id: "cover", type: "cover" }] };
  const serializedSource = `${JSON.stringify(source, null, 2)}\n`;
  await Promise.all([
    writeFile(pagePath, "page"),
    writeFile(pdfPath, "pdf"),
    writeFile(sourcePath, serializedSource, "utf8"),
  ]);
  await writeCompleteRenderReport(reportPath, pdfPath, [pagePath], ["cover"], sourcePath);
  const pages = [{ file: path.basename(pagePath), sha256: sha256(await readFile(pagePath)) }];

  const valid = await inspectRenderReport(reportPath, pages, pdfPath, sourcePath);
  assert.equal(valid.report.sourceHashValid, true, valid.issues.join("\n"));
  assert.equal(valid.report.dossierHashValid, true, valid.issues.join("\n"));
  assert.equal(valid.report.fullFinalRender, true, valid.issues.join("\n"));

  await writeFile(sourcePath, `${serializedSource}\n`, "utf8");
  const sourceTamper = await inspectRenderReport(reportPath, pages, pdfPath, sourcePath);
  assert.equal(sourceTamper.report.sourceHashValid, false);
  assert.equal(sourceTamper.report.dossierHashValid, true);
  assert.match(sourceTamper.issues.join(" "), /source hash or filename/);

  await writeFile(sourcePath, serializedSource, "utf8");
  const parsed: unknown = JSON.parse(await readFile(reportPath, "utf8"));
  assert.ok(isRecord(parsed) && isRecord(parsed.integrity) && isRecord(parsed.integrity.source));
  parsed.integrity.source.dossierSha256 = sha256("wrong-loaded-dossier");
  await writeFile(reportPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  await checksum(reportPath);
  const dossierTamper = await inspectRenderReport(reportPath, pages, pdfPath, sourcePath);
  assert.equal(dossierTamper.report.sourceHashValid, true);
  assert.equal(dossierTamper.report.dossierHashValid, false);
  assert.match(dossierTamper.issues.join(" "), /dossier hash does not match/);
});

test("render source audit loads TypeScript with extensionless local imports", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "render-ts-source-audit-"));
  context.after(async () => rm(temporary, { force: true, recursive: true }));
  const fragmentPath = path.join(temporary, "fragment.ts");
  const sourcePath = path.join(temporary, "deck.ts");
  const dossier = { meta: { title: "TypeScript fixture" }, slides: [{ id: "cover", type: "cover" }] };
  await writeFile(fragmentPath, `export const dossier = ${JSON.stringify(dossier)};\n`, "utf8");
  await writeFile(sourcePath, 'import { dossier } from "./fragment";\nexport default dossier;\n', "utf8");
  const sourceBytes = await readFile(sourcePath);
  const declared = {
    file: path.basename(sourcePath),
    sha256: sha256(sourceBytes),
    dossierSha256: sha256(JSON.stringify(dossier)),
  };

  const valid = await inspectRenderSource(declared, sourcePath);
  assert.equal(valid.sourceHashValid, true, valid.issues.join("\n"));
  assert.equal(valid.dossierHashValid, true, valid.issues.join("\n"));

  const tampered = await inspectRenderSource(
    { ...declared, dossierSha256: sha256("tampered") },
    sourcePath,
  );
  assert.equal(tampered.dossierHashValid, false);
  assert.match(tampered.issues.join(" "), /dossier hash does not match/);
});
