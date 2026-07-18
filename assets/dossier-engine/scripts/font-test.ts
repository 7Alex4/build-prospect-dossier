import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { exampleDossier } from "../src/content/example";
import { imageTestDossier } from "../src/content/image-test";
import { validateDossier } from "../src/schema/validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone(): UnknownRecord {
  return structuredClone(exampleDossier) as unknown as UnknownRecord;
}

function typography(value: UnknownRecord): UnknownRecord {
  if (!isRecord(value.theme) || !isRecord(value.theme.typography)) throw new Error("Typographie de fixture absente.");
  return value.theme.typography;
}

function firstFace(value: UnknownRecord): UnknownRecord {
  const faces = typography(value).faces;
  if (!Array.isArray(faces) || !isRecord(faces[0])) throw new Error("Contrat de fontes absent.");
  return faces[0];
}

function hasIssue(value: unknown, code: string): boolean {
  return validateDossier(value).some((issue) => issue.code === code);
}

assert.ok(!hasIssue(exampleDossier, "font-contract-required"));

const missing = clone();
delete typography(missing).faces;
assert.ok(hasIssue(missing, "font-contract-required"));

const draftWithoutContract = structuredClone(imageTestDossier);
delete (draftWithoutContract.theme.typography as UnknownRecord).faces;
assert.ok(!hasIssue(draftWithoutContract, "font-contract-required"));

const mismatch = clone();
firstFace(mismatch).family = "Famille étrangère";
assert.ok(hasIssue(mismatch, "font-family-mismatch"));

const missingWeight = clone();
firstFace(missingWeight).weights = [400];
assert.ok(hasIssue(missingWeight, "font-weight-required"));

const localWithoutHash = clone();
firstFace(localWithoutHash).source = {
  kind: "local",
  file: "assets/fonts/open-source.woff2",
  format: "woff2",
  license: "OFL-1.1",
  sha256: "invalide",
};
assert.ok(hasIssue(localWithoutHash, "font-hash"));

const escapingPath = clone();
firstFace(escapingPath).source = {
  kind: "local",
  file: "../private-font.woff2",
  format: "woff2",
  license: "Licence de test",
  sha256: "a".repeat(64),
};
assert.ok(hasIssue(escapingPath, "font-file"));

const baseCss = readFileSync(new URL("../src/styles/base.css", import.meta.url), "utf8");
assert.ok(!baseCss.includes("font-weight: 800"));

console.log("Tests fontes: contrat final, familles, graisses, licences, chemins et empreintes validés.");
