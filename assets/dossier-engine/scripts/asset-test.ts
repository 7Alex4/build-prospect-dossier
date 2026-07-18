import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { exampleDossier } from "../src/content/example";
import { imageTestDossier } from "../src/content/image-test";
import { neutralMotifFull, neutralProofImage } from "../src/content/neutral-assets";
import type { Dossier, DossierSlide } from "../src/schema/types";
import {
  collectDossierAssetUsages,
  collectSlideAssetIds,
  collectThemeAssetIds,
} from "../src/schema/asset-validation";
import { validateDossier } from "../src/schema/validation";
import { fontContractSha256, type RenderFontAudit } from "./lib/render-fonts";
import { createRenderReport, type RenderIntegrity } from "./lib/render-report";

type UnknownRecord = Record<string, unknown>;

const pdfPage = { height: 595.28, unit: "pt", width: 841.89 } as const;
const fixtureHash = "a".repeat(64);

function integrityFor(slides: readonly { readonly id: string }[]): RenderIntegrity {
  return {
    pages: slides.map((entry, index) => ({
      file: `${String(index + 1).padStart(2, "0")}-${entry.id}.png`,
      sha256: fixtureHash,
      slideId: entry.id,
    })),
    pdf: { file: "dossier.pdf", sha256: fixtureHash },
    source: { file: "deck.ts", sha256: fixtureHash, dossierSha256: fixtureHash },
  };
}

function fontAuditFor(dossier: Dossier): RenderFontAudit {
  return {
    contract: dossier.theme.typography.faces ?? [],
    contractSha256: fontContractSha256(dossier.theme),
    faces: (dossier.theme.typography.faces ?? []).flatMap((face) => face.weights.map((weight) => ({
      family: face.family,
      isCustomFont: face.source.kind === "local",
      license: face.source.license,
      postScriptName: face.family,
      resolvedFamily: face.source.kind === "system" ? face.source.allowedResolvedFamilies[0] ?? face.family : face.family,
      role: face.role,
      sourceFile: face.source.kind === "local" ? face.source.file : null,
      sourceKind: face.source.kind,
      sourceSha256: fixtureHash,
      style: face.style,
      weight,
    }))),
  };
}

function withEvidenceId<T extends DossierSlide>(slide: T, evidenceId: string): T {
  return { ...slide, evidenceIds: [...(slide.evidenceIds ?? []), evidenceId] };
}

function hydratedSourceHash(src: string): string {
  const separator = src.indexOf(",");
  const header = separator < 0 ? "" : src.slice(0, separator);
  const payload = separator < 0 ? src : src.slice(separator + 1);
  const content = header.endsWith(";base64")
    ? Buffer.from(payload, "base64")
    : decodeURIComponent(payload);
  return createHash("sha256").update(content).digest("hex");
}

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
meta(generatedForbidden).generativeAssetsAuthorization = {
  status: "explicitly-authorized",
  authorizedBy: "Fixture validator",
  reference: "fixture:asset-authorization",
};
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

const fullReport = createRenderReport(
  exampleDossier,
  exampleDossier.slides,
  [],
  pdfPage,
  integrityFor(exampleDossier.slides),
  fontAuditFor(exampleDossier),
);
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
assert.equal(fullReport.integrity.pages.length, exampleDossier.slides.length);
assert.deepEqual(
  fullReport.traceability.find((entry) => entry.slideId === "04-preuves")?.assetIds,
  [neutralProofImage.id],
);
assert.deepEqual(
  fullReport.traceability.find((entry) => entry.slideId === "04-preuves")?.evidenceIds,
  ["fixture:narrative-plan", "fixture:vector-assets"],
);

const ledgerBacked = structuredClone(exampleDossier);
const ledgerAsset = ledgerBacked.assets.find((entry) => entry.id === neutralProofImage.id);
if (ledgerAsset === undefined) throw new Error("Asset de registre absent.");
delete ledgerAsset.src;
ledgerAsset.ledgerId = "ledger:neutral-proof";
const ledgerReport = createRenderReport(
  ledgerBacked,
  ledgerBacked.slides,
  [],
  pdfPage,
  integrityFor(ledgerBacked.slides),
  fontAuditFor(ledgerBacked),
);
const ledgerTrace = ledgerReport.assetRegistry.find((entry) => entry.id === neutralProofImage.id);
assert.equal(ledgerTrace?.sourceIdentity.kind, "data-uri");
assert.equal(ledgerTrace?.sourceIdentity.sha256, hydratedSourceHash(neutralProofImage.src));
assert.notEqual(
  ledgerTrace?.sourceIdentity.sha256,
  createHash("sha256").update("ledger:neutral-proof").digest("hex"),
);

const divergentUsage = structuredClone(ledgerBacked);
const divergentRisk = divergentUsage.slides.find((entry) => entry.type === "risk");
if (divergentRisk?.type !== "risk" || divergentRisk.image === undefined) {
  throw new Error("Image risque de fixture absente.");
}
divergentRisk.image.id = neutralProofImage.id;
assert.throws(
  () => createRenderReport(
    divergentUsage,
    divergentUsage.slides,
    [],
    pdfPage,
    integrityFor(divergentUsage.slides),
    fontAuditFor(divergentUsage),
  ),
  /plusieurs contenus hydratés/,
);

const partialSlide = imageTestDossier.slides[1];
assert.ok(partialSlide);
const partialReport = createRenderReport(
  imageTestDossier,
  [partialSlide],
  [partialSlide.id],
  pdfPage,
  integrityFor([partialSlide]),
  fontAuditFor(imageTestDossier),
);
assert.equal(partialReport.stage, "draft");
assert.equal(partialReport.totalSlides, imageTestDossier.slides.length);
assert.equal(partialReport.renderedCount, 1);
assert.equal(partialReport.selectionApplied, true);
assert.deepEqual(partialReport.selection, [partialSlide.id]);
assert.deepEqual(partialReport.renderedSlideIds, [partialSlide.id]);

const internalDossier = {
  ...exampleDossier,
  evidence: [
    ...exampleDossier.evidence,
    { id: "fixture:private", kind: "proposal", status: "internal-only", claim: "Note privée" },
  ],
  slides: exampleDossier.slides.map((entry, index) => index === 0
    ? withEvidenceId(entry, "fixture:private")
    : entry),
} satisfies Dossier;
assert.throws(
  () => createRenderReport(
    internalDossier,
    internalDossier.slides,
    [],
    pdfPage,
    integrityFor(internalDossier.slides),
    fontAuditFor(internalDossier),
  ),
  /internal-only/,
);

console.log("Tests assets: registre, droits, scopes, thèmes, storyboards et rapports validés.");
