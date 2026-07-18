import assert from "node:assert/strict";
import { exampleDossier } from "../src/content/example";
import { imageTestDossier } from "../src/content/image-test";
import { neutralMotifFull, neutralProofImage } from "../src/content/neutral-assets";
import {
  collectDossierAssetUsages,
  collectSlideAssetIds,
  collectThemeAssetIds,
} from "../src/schema/asset-validation";
import { validateDossier } from "../src/schema/validation";
import { createRenderReport } from "./lib/render-report";

type UnknownRecord = Record<string, unknown>;

const pdfPage = { height: 595.28, unit: "pt", width: 841.89 } as const;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone(): unknown {
  return structuredClone(exampleDossier) as unknown;
}

function slide(value: unknown, id: string): UnknownRecord {
  if (!isRecord(value) || !Array.isArray(value.slides)) throw new Error("Slides de fixture absentes.");
  const found = value.slides.find((entry) => isRecord(entry) && entry.id === id);
  if (!isRecord(found)) throw new Error(`Slide de fixture absente: ${id}.`);
  return found;
}

function image(value: unknown, slideId: string): UnknownRecord {
  const asset = slide(value, slideId).image;
  if (!isRecord(asset)) throw new Error(`Image de fixture absente: ${slideId}.`);
  return asset;
}

function asset(value: unknown, id: string): UnknownRecord {
  if (!isRecord(value) || !Array.isArray(value.assets)) throw new Error("Registre d'assets absent.");
  const found = value.assets.find((entry) => isRecord(entry) && entry.id === id);
  if (!isRecord(found)) throw new Error(`Asset de fixture absent: ${id}.`);
  return found;
}

function meta(value: unknown): UnknownRecord {
  if (!isRecord(value) || !isRecord(value.meta)) throw new Error("Meta de fixture absente.");
  return value.meta;
}

function hasIssue(value: unknown, code: string, pathFragment?: string): boolean {
  return validateDossier(value).some((entry) =>
    entry.code === code && (pathFragment === undefined || entry.path.includes(pathFragment)),
  );
}

assert.equal(validateDossier(exampleDossier).filter((entry) => entry.level === "error").length, 0);
assert.equal(new Set(exampleDossier.assets.map((entry) => entry.id)).size, exampleDossier.assets.length);
assert.ok(exampleDossier.assets.every((entry) => entry.status === "approved"));

const usagePaths = collectDossierAssetUsages(exampleDossier).map((usage) => usage.path);
assert.ok(usagePaths.includes("theme.motif.assets.full"));
assert.ok(usagePaths.includes("slides[12].frames[0].image"));
assert.ok(collectThemeAssetIds(exampleDossier.theme).includes(neutralMotifFull.id));
const proofSlide = exampleDossier.slides.find((entry) => entry.id === "04-preuves");
assert.ok(proofSlide);
assert.deepEqual(collectSlideAssetIds(proofSlide), [neutralProofImage.id]);

const missingImageId = clone();
delete image(missingImageId, "04-preuves").id;
assert.ok(hasIssue(missingImageId, "asset-id-required", "slides[3].image.id"));

const unknownImageId = clone();
image(unknownImageId, "04-preuves").id = "fixture:missing";
assert.ok(hasIssue(unknownImageId, "asset-unregistered", "slides[3].image.id"));

const missingRegistryEntry = clone();
if (!isRecord(missingRegistryEntry) || !Array.isArray(missingRegistryEntry.assets)) {
  throw new Error("Registre de fixture absent.");
}
missingRegistryEntry.assets = missingRegistryEntry.assets.filter((entry) =>
  !isRecord(entry) || entry.id !== neutralMotifFull.id,
);
assert.ok(hasIssue(missingRegistryEntry, "asset-unregistered", "theme.motif.assets.full.id"));

const uncleared = clone();
asset(uncleared, neutralProofImage.id).status = "unknown";
assert.ok(hasIssue(uncleared, "asset-rights-status"));

const wrongScope = clone();
asset(wrongScope, neutralProofImage.id).allowedDistributionScopes = ["public"];
assert.ok(hasIssue(wrongScope, "asset-distribution-scope"));

const generatedForbidden = clone();
asset(generatedForbidden, neutralProofImage.id).origin = "generated";
assert.ok(hasIssue(generatedForbidden, "asset-generative-policy"));
meta(generatedForbidden).generativeAssets = "authorized";
assert.ok(!hasIssue(generatedForbidden, "asset-generative-policy"));

const storyboardUnknown = clone();
const storyboard = slide(storyboardUnknown, "13-storyboard-serie");
if (!Array.isArray(storyboard.frames) || !isRecord(storyboard.frames[0]) || !isRecord(storyboard.frames[0].image)) {
  throw new Error("Storyboard de fixture absent.");
}
storyboard.frames[0].image.id = "fixture:storyboard-missing";
assert.ok(hasIssue(storyboardUnknown, "asset-unregistered", "frames[0].image.id"));

const mismatchedSource = clone();
asset(mismatchedSource, neutralProofImage.id).src = "data:image/svg+xml,mismatch";
assert.ok(hasIssue(mismatchedSource, "asset-src-mismatch"));

const manualAssetIds = clone();
slide(manualAssetIds, "04-preuves").assetIds = [neutralProofImage.id];
assert.ok(hasIssue(manualAssetIds, "asset-ids-derived"));

const fullReport = createRenderReport(exampleDossier, exampleDossier.slides, [], pdfPage);
const serializedFullReport = JSON.stringify(fullReport);
assert.equal(fullReport.schemaVersion, "1.0");
assert.equal(fullReport.stage, "final");
assert.equal(fullReport.totalSlides, 18);
assert.equal(fullReport.renderedCount, 18);
assert.equal(fullReport.selectionApplied, false);
assert.deepEqual(fullReport.selection, []);
assert.deepEqual(fullReport.renderedSlideIds, exampleDossier.slides.map((entry) => entry.id));
assert.ok(fullReport.themeAssetIds.includes(neutralMotifFull.id));
assert.ok(!serializedFullReport.includes("data:image"));
assert.ok(Buffer.byteLength(serializedFullReport, "utf8") < 2 * 1024 * 1024);
assert.ok(fullReport.assetRegistry.every((entry) => entry.sourceIdentity.sha256.length === 64));
assert.deepEqual(
  fullReport.traceability.find((entry) => entry.slideId === "04-preuves")?.assetIds,
  [neutralProofImage.id],
);
assert.deepEqual(
  fullReport.traceability.find((entry) => entry.slideId === "04-preuves")?.evidenceIds,
  ["fixture:vector-assets"],
);

const partialSlide = imageTestDossier.slides[1];
assert.ok(partialSlide);
const partialReport = createRenderReport(imageTestDossier, [partialSlide], [partialSlide.id], pdfPage);
assert.equal(partialReport.stage, "draft");
assert.equal(partialReport.totalSlides, imageTestDossier.slides.length);
assert.equal(partialReport.renderedCount, 1);
assert.equal(partialReport.selectionApplied, true);
assert.deepEqual(partialReport.selection, [partialSlide.id]);
assert.deepEqual(partialReport.renderedSlideIds, [partialSlide.id]);

console.log("Tests assets: registre, droits, scopes, thèmes, storyboards et rapports validés.");
