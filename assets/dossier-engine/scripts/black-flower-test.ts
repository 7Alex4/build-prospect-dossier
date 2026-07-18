import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "../src/App";
import { blackFlowerValidationFixture } from "../src/content/black-flower-validation-fixture";
import { exampleDossier } from "../src/content/example";
import { validateDossier } from "../src/schema/validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone(): unknown {
  return structuredClone(blackFlowerValidationFixture) as unknown;
}

function meta(value: unknown): UnknownRecord {
  if (!isRecord(value) || !isRecord(value.meta)) throw new Error("Meta de fixture absente.");
  return value.meta;
}

function slides(value: unknown): UnknownRecord[] {
  if (!isRecord(value) || !Array.isArray(value.slides)) throw new Error("Slides de fixture absentes.");
  return value.slides.filter(isRecord);
}

function slide(value: unknown, id: string): UnknownRecord {
  const match = slides(value).find((entry) => entry.id === id);
  if (!match) throw new Error(`Slide absente: ${id}.`);
  return match;
}

function hasIssue(value: unknown, code: string): boolean {
  return validateDossier(value).some((entry) => entry.code === code);
}

const validIssues = validateDossier(blackFlowerValidationFixture);
assert.equal(validIssues.filter((entry) => entry.level === "error").length, 0);
assert.equal(blackFlowerValidationFixture.meta.frameworkProfile, "black-flower");
assert.equal(blackFlowerValidationFixture.meta.studioIdentity?.signature, "BlackFlower");
assert.equal(blackFlowerValidationFixture.slides.filter((entry) => entry.visualIntent === "image-led").length, 9);
assert.equal(blackFlowerValidationFixture.slides.filter((entry) => entry.visualIntent === "diagram").length, 2);
assert.ok(new Set(blackFlowerValidationFixture.slides.map((entry) => entry.compositionFamily)).size >= 6);
assert.ok(blackFlowerValidationFixture.slides.filter((entry) => entry.visualPeak).length >= 3);
assert.equal(validateDossier(exampleDossier).filter((entry) => entry.level === "error").length, 0);
assert.ok(!Object.hasOwn(blackFlowerValidationFixture.slides[0] ?? {}, "image"));

const markup = renderToStaticMarkup(createElement(App, { dossier: blackFlowerValidationFixture }));
assert.ok(markup.includes('data-framework-profile="black-flower"'));
assert.ok(markup.includes('data-composition-family="image-dominant"'));
assert.ok(markup.includes('data-visual-intent="image-led"'));
assert.ok(markup.includes("slide--composition-image-dominant"));
assert.ok(markup.includes("slide--visual-peak"));
assert.ok(markup.includes("Strategic creative campaign proposal · BlackFlower"));
assert.ok(markup.includes('data-presentation="cutout"'));
assert.ok(markup.includes("film-product-cutout"));
assert.ok(markup.includes("timeline-track--image-sequence"));
assert.ok(markup.includes("BlackFlower"));
assert.ok(markup.includes("01 / 18"));
assert.ok(!markup.includes("cover-text-visual"));
assert.ok(!markup.includes('role="meter"'));

const css = readFileSync(new URL("../src/styles/black-flower-profile.css", import.meta.url), "utf8");
const compositionCss = readFileSync(new URL("../src/styles/black-flower-compositions.css", import.meta.url), "utf8");
assert.ok(css.includes("--bf-body-min: 24px"));
assert.ok(css.includes("padding: 108px 140px 120px"));
assert.ok(css.includes("left: 84px"));
assert.ok(css.includes("font-size: 36px"));
assert.ok(!css.includes("font-size: 17px"));
assert.ok(!css.includes("font-size: 13px"));
assert.ok(compositionCss.includes(".slide--composition-image-dominant"));
assert.ok(compositionCss.includes(".slide--composition-editorial-split"));
assert.ok(compositionCss.includes(".slide--composition-silent-cover"));
assert.ok(compositionCss.includes(".slide--composition-editorial-columns"));
assert.ok(compositionCss.includes(".slide--composition-typographic-manifesto"));
assert.ok(compositionCss.includes(".slide--composition-reference-wall"));
assert.ok(compositionCss.includes(".slide--composition-diagrammatic-system"));
assert.ok(compositionCss.includes(".slide--composition-closing-letter"));
assert.ok(compositionCss.includes(".slide--composition-lockup"));
assert.ok(compositionCss.includes(".slide--intent-image-led"));

const missingIntent = clone();
delete slide(missingIntent, "03-pourquoi-maintenant").visualIntent;
assert.ok(hasIssue(missingIntent, "black-flower-visual-intent"));

const missingRationale = clone();
delete slide(missingRationale, "03-pourquoi-maintenant").visualIntentRationale;
assert.ok(hasIssue(missingRationale, "black-flower-visual-rationale"));

const missingFamily = clone();
delete slide(missingFamily, "03-pourquoi-maintenant").compositionFamily;
assert.ok(hasIssue(missingFamily, "black-flower-composition-family"));

const missingPeakFlag = clone();
delete slide(missingPeakFlag, "03-pourquoi-maintenant").visualPeak;
assert.ok(hasIssue(missingPeakFlag, "black-flower-visual-peak"));

const truncatedNarrative = clone();
if (!isRecord(truncatedNarrative)) throw new Error("Fixture invalide.");
truncatedNarrative.slides = slides(truncatedNarrative).filter((entry) =>
  ["01-ouverture", "04-preuves", "06-risque", "07-basculements", "17-merci", "18-signature"].includes(String(entry.id)),
);
assert.ok(hasIssue(truncatedNarrative, "black-flower-slide-count"));
assert.ok(hasIssue(truncatedNarrative, "black-flower-narrative-required"));

const oversizedNarrative = clone();
if (!isRecord(oversizedNarrative)) throw new Error("Fixture invalide.");
oversizedNarrative.slides = [...slides(oversizedNarrative), ...slides(oversizedNarrative).slice(1, 5)];
assert.ok(hasIssue(oversizedNarrative, "black-flower-slide-count"));

const missingRouteCount = clone();
delete meta(missingRouteCount).creativeRouteCount;
assert.ok(hasIssue(missingRouteCount, "black-flower-route-count"));

const missingBaselineImage = clone();
delete slide(missingBaselineImage, "04-preuves").image;
assert.ok(hasIssue(missingBaselineImage, "black-flower-current-baseline"));

const singleRoute = clone();
if (!isRecord(singleRoute)) throw new Error("Fixture invalide.");
singleRoute.slides = slides(singleRoute).filter((entry) => entry.id !== "12-film-serie");
meta(singleRoute).creativeRouteCount = 1;
assert.ok(hasIssue(singleRoute, "black-flower-route-depth"));

const proposalWash = clone();
slides(proposalWash).forEach((entry) => {
  if (!Array.isArray(entry.claims)) return;
  entry.claims.forEach((claim) => {
    if (!isRecord(claim)) return;
    claim.kind = "proposal";
    delete claim.evidenceIds;
  });
});
assert.ok(hasIssue(proposalWash, "black-flower-claim-mix"));
assert.ok(hasIssue(proposalWash, "black-flower-objective-claims"));
assert.ok(hasIssue(proposalWash, "black-flower-grounded-section"));

const unsourcedInterpretation = clone();
const riskClaims = slide(unsourcedInterpretation, "06-risque").claims;
if (!Array.isArray(riskClaims) || !isRecord(riskClaims[0])) throw new Error("Claim de risque absent.");
delete riskClaims[0].evidenceIds;
assert.ok(hasIssue(unsourcedInterpretation, "black-flower-interpretation-source"));

const uncoveredFooter = clone();
slide(uncoveredFooter, "04-preuves").footer = "Fondée en 1842 et leader mondial";
assert.ok(hasIssue(uncoveredFooter, "claim-coverage"));

const uncoveredLegal = clone();
slide(uncoveredLegal, "18-signature").legal = "Fondée en 1842 et leader mondial";
assert.ok(hasIssue(uncoveredLegal, "claim-coverage"));

const weakImageCadence = clone();
const architecture = slide(weakImageCadence, "02-architecture");
architecture.visualIntent = "typographic";
delete architecture.image;
assert.ok(hasIssue(weakImageCadence, "black-flower-media-cadence"));

const weakImageRatio = clone();
slides(weakImageRatio).forEach((entry) => {
  if (entry.visualIntent === "image-led") entry.visualIntent = "image-supported";
});
assert.ok(hasIssue(weakImageRatio, "black-flower-image-led-ratio"));

const diagramOverflow = clone();
slide(diagramOverflow, "09-methode").visualIntent = "diagram";
assert.ok(hasIssue(diagramOverflow, "black-flower-diagram-cap"));

const riskWithoutMedia = clone();
delete slide(riskWithoutMedia, "06-risque").image;
assert.ok(hasIssue(riskWithoutMedia, "black-flower-required-media"));

const activationWithoutMedia = clone();
delete slide(activationWithoutMedia, "14-activation").image;
assert.ok(hasIssue(activationWithoutMedia, "black-flower-required-media"));

const neutralWithoutRiskMedia: unknown = structuredClone(exampleDossier);
delete slide(neutralWithoutRiskMedia, "06-risque").image;
assert.ok(!hasIssue(neutralWithoutRiskMedia, "black-flower-required-media"));

const genericMotif = clone();
if (isRecord(genericMotif) && isRecord(genericMotif.theme) && isRecord(genericMotif.theme.motif)) {
  genericMotif.theme.motif.kind = "grid";
  genericMotif.theme.motif.derivation = "generic";
}
assert.ok(hasIssue(genericMotif, "black-flower-generic-motif"));

const wrongPageMarker = clone();
if (isRecord(wrongPageMarker) && isRecord(wrongPageMarker.theme)) {
  wrongPageMarker.theme.pageMarker = { kind: "rotating-asset" };
}
assert.ok(hasIssue(wrongPageMarker, "black-flower-page-marker"));

const hiddenFooter = clone();
if (isRecord(hiddenFooter) && isRecord(hiddenFooter.theme) && isRecord(hiddenFooter.theme.chrome)) {
  hiddenFooter.theme.chrome.footer = "hidden";
}
assert.ok(hasIssue(hiddenFooter, "black-flower-footer"));

const unsafePalette = clone();
if (isRecord(unsafePalette) && isRecord(unsafePalette.theme) && isRecord(unsafePalette.theme.palette)) {
  unsafePalette.theme.palette.paper = "url(https://tracker.invalid/pixel.png)";
}
assert.ok(hasIssue(unsafePalette, "theme-color"));

const placeholder = clone();
const proofImage = slide(placeholder, "04-preuves").image;
if (!isRecord(proofImage)) throw new Error("Image de preuve absente.");
proofImage.productionStatus = "placeholder";
assert.ok(hasIssue(placeholder, "black-flower-media-final"));

const foreignVisibleCopy = clone();
slide(foreignVisibleCopy, "06-risque").lead = "Une proposition visible signée Nexaia.";
assert.ok(hasIssue(foreignVisibleCopy, "black-flower-foreign-signature"));

const missingReference = clone();
const references = slide(missingReference, "16-references").references;
if (!Array.isArray(references) || !isRecord(references[0])) throw new Error("Référence absente.");
delete references[0].image;
assert.ok(hasIssue(missingReference, "black-flower-reference-media"));

const wrongTextMark = clone();
slide(wrongTextMark, "18-signature").textMark = "Studio générique";
assert.ok(hasIssue(wrongTextMark, "black-flower-lockup-signature"));

const weakFamilies = clone();
slides(weakFamilies).forEach((entry) => { entry.compositionFamily = "editorial-split"; });
assert.ok(hasIssue(weakFamilies, "black-flower-composition-diversity"));
assert.ok(hasIssue(weakFamilies, "black-flower-composition-overuse"));
assert.ok(hasIssue(weakFamilies, "black-flower-adjacent-compositions"));

const repeatedAdjacentFamily = clone();
slide(repeatedAdjacentFamily, "03-pourquoi-maintenant").compositionFamily = "diagrammatic-system";
assert.ok(hasIssue(repeatedAdjacentFamily, "black-flower-adjacent-compositions"));

const unboundFamily = clone();
slide(unboundFamily, "07-basculements").compositionFamily = "portrait-profile";
assert.ok(hasIssue(unboundFamily, "black-flower-composition-binding"));

const incompleteSequence = clone();
const sequenceSteps = slide(incompleteSequence, "09-methode").steps;
if (!Array.isArray(sequenceSteps) || !isRecord(sequenceSteps[0])) throw new Error("Étape de séquence absente.");
delete sequenceSteps[0].image;
assert.ok(hasIssue(incompleteSequence, "black-flower-sequence-media"));

const invalidCutout = clone();
const invalidCutoutAsset = slide(invalidCutout, "10-film-hero").productCutout;
if (!isRecord(invalidCutoutAsset)) throw new Error("Cutout de fixture absent.");
invalidCutoutAsset.fit = "cover";
assert.ok(hasIssue(invalidCutout, "black-flower-product-cutout"));

const weakPeaks = clone();
slides(weakPeaks).forEach((entry) => { entry.visualPeak = false; });
assert.ok(hasIssue(weakPeaks, "black-flower-visual-peak-count"));

console.log("Tests Black Flower: identité, cadence, compositions, cutouts et séquences validés.");
