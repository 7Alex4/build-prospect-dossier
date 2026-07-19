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

const wrongProductionTitle = clone();
slide(wrongProductionTitle, "15-production").title = "Notre production";
assert.ok(hasIssue(wrongProductionTitle, "black-flower-production-title"));

const horizontalPortrait = clone();
const horizontalPortraitAsset = slide(horizontalPortrait, "15-production").image;
if (!isRecord(horizontalPortraitAsset)) throw new Error("Portrait de fixture absent.");
horizontalPortraitAsset.sourceDimensions = { height: 1414, width: 2000 };
assert.ok(hasIssue(horizontalPortrait, "black-flower-portrait-ratio"));

const unsafePortrait = clone();
const unsafePortraitAsset = slide(unsafePortrait, "15-production").image;
if (!isRecord(unsafePortraitAsset)) throw new Error("Portrait de fixture absent.");
unsafePortraitAsset.subjectSafeBox = { height: .96, width: .7, x: .15, y: 0 };
assert.ok(hasIssue(unsafePortrait, "black-flower-portrait-safe-box"));

const wrongPortraitPresentation = clone();
const wrongPortraitAsset = slide(wrongPortraitPresentation, "15-production").image;
if (!isRecord(wrongPortraitAsset)) throw new Error("Portrait de fixture absent.");
wrongPortraitAsset.presentation = "cutout";
assert.ok(hasIssue(wrongPortraitPresentation, "black-flower-finish-image"));

const shortThanks = clone();
slide(shortThanks, "17-merci").paragraphs = ["Merci.", "À bientôt.", "Avec plaisir."];
assert.ok(hasIssue(shortThanks, "black-flower-thanks-letter"));

const thanksCta = clone();
slide(thanksCta, "17-merci").nextStep = "Réserver 45 minutes";
assert.ok(hasIssue(thanksCta, "black-flower-finish-silence"));

const verboseLockup = clone();
slide(verboseLockup, "18-signature").legal = "Document de prospection";
assert.ok(hasIssue(verboseLockup, "black-flower-finish-silence"));

const wrongSeparator = clone();
slide(wrongSeparator, "18-signature").separator = "gap";
assert.ok(hasIssue(wrongSeparator, "black-flower-lockup-separator"));

const unstableBackgrounds = clone();
slides(unstableBackgrounds).forEach((entry, index) => {
  entry.backgroundField = index % 2 === 0 ? "cover" : "body";
  entry.tone = index % 2 === 0 ? "ink" : "paper";
});
assert.ok(hasIssue(unstableBackgrounds, "black-flower-background-transitions"));

const driftingBodyField = clone();
slide(driftingBodyField, "09-methode").tone = "surface";
assert.ok(hasIssue(driftingBodyField, "black-flower-background-field-drift"));

const mismatchedClosingField = clone();
slide(mismatchedClosingField, "18-signature").tone = "surface";
assert.ok(hasIssue(mismatchedClosingField, "black-flower-background-loop"));

console.log("Tests finitions: variantes, portrait, lettre, lockup et rythme de fond validés.");
