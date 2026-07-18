import assert from "node:assert/strict";
import { blackFlowerValidationFixture } from "../src/content/black-flower-validation-fixture";
import { validateDossier } from "../src/schema/validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone(): unknown {
  return structuredClone(blackFlowerValidationFixture) as unknown;
}

function slides(value: unknown): UnknownRecord[] {
  if (!isRecord(value) || !Array.isArray(value.slides)) throw new Error("Slides absentes.");
  return value.slides.filter(isRecord);
}

function slide(value: unknown, id: string): UnknownRecord {
  const match = slides(value).find((entry) => entry.id === id);
  if (!match) throw new Error(`Slide absente: ${id}.`);
  return match;
}

function assets(value: unknown): UnknownRecord[] {
  if (!isRecord(value) || !Array.isArray(value.assets)) throw new Error("Assets absents.");
  if (!value.assets.every(isRecord)) throw new Error("Registre d'assets invalide.");
  return value.assets;
}

function hasIssue(value: unknown, code: string): boolean {
  return validateDossier(value).some((entry) => entry.code === code);
}

const generatedDominance = clone();
assets(generatedDominance).forEach((entry) => { entry.origin = "generated"; });
assert.ok(hasIssue(generatedDominance, "black-flower-real-documentary-ratio"));
assert.ok(hasIssue(generatedDominance, "black-flower-generated-ratio"));

const mixedGenerated = clone();
const cutout = slide(mixedGenerated, "10-film-hero").productCutout;
if (!isRecord(cutout)) throw new Error("Cutout absent.");
["04-preuves", "06-risque", "07-basculements", "10-film-hero", "11-storyboard-hero"].forEach((id) => {
  slide(mixedGenerated, id).productCutout = structuredClone(cutout);
});
const cutoutRecord = assets(mixedGenerated).find((entry) => entry.id === cutout.id);
if (!cutoutRecord) throw new Error("Registre du cutout absent.");
cutoutRecord.origin = "generated";
assert.ok(hasIssue(mixedGenerated, "black-flower-generated-ratio"));
assert.ok(!hasIssue(mixedGenerated, "black-flower-real-documentary-ratio"));
assert.ok(hasIssue(mixedGenerated, "asset-synthetic-misrepresentation"));

const studioIllustrations = clone();
assets(studioIllustrations).forEach((entry) => { entry.origin = "studio-created"; });
slides(studioIllustrations).forEach((entry) => {
  [entry.image, entry.productCutout].forEach((candidate) => {
    if (isRecord(candidate)) candidate.mediaNature = "illustration";
  });
});
assert.ok(hasIssue(studioIllustrations, "black-flower-real-documentary-ratio"));

const hiddenGeneratedPages = clone();
const sourceImage = slide(hiddenGeneratedPages, "12-film-serie").image;
if (!isRecord(sourceImage) || typeof sourceImage.src !== "string") throw new Error("Image source absente.");
assets(hiddenGeneratedPages).push({
  id: "fixture:hidden-generated",
  src: sourceImage.src,
  origin: "generated",
  rightsBasis: "Autorisation de fixture",
  status: "approved",
  allowedDistributionScopes: ["private-prospecting"],
});
["04-preuves", "06-risque", "07-basculements", "10-film-hero", "12-film-serie", "14-activation", "15-production"]
  .forEach((id) => {
    const target = slide(hiddenGeneratedPages, id);
    target.image = {
      ...structuredClone(sourceImage),
      id: "fixture:hidden-generated",
      mediaNature: "illustration",
      mediaRole: "film-still",
    };
    target.visualIntent = "typographic";
  });
assert.ok(hasIssue(hiddenGeneratedPages, "black-flower-generated-ratio"));

const generatedProof = clone();
const proof = slide(generatedProof, "04-preuves");
if (!isRecord(proof.image) || typeof proof.image.src !== "string") throw new Error("Preuve absente.");
assets(generatedProof).push({
  id: "fixture:generated-proof",
  src: proof.image.src,
  origin: "generated",
  rightsBasis: "Autorisation de fixture",
  status: "approved",
  allowedDistributionScopes: ["private-prospecting"],
});
proof.image = {
  ...structuredClone(proof.image),
  id: "fixture:generated-proof",
  mediaNature: "illustration",
  mediaRole: "editorial",
};
assert.ok(hasIssue(generatedProof, "black-flower-diagnostic-media"));

console.log("Tests sources Black Flower: réel, documentaire et généré validés.");
