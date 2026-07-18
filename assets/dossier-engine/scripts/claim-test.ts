import assert from "node:assert/strict";
import { exampleDossier } from "../src/content/example";
import {
  claimMatchesTarget,
  resolveSlideContentPath,
  substantiveContentEntries,
} from "../src/schema/content-claims";
import type { DossierSlide } from "../src/schema/types";
import { validateDossier } from "../src/schema/validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone(stage: "draft" | "final" = "draft"): unknown {
  const value: unknown = structuredClone(exampleDossier);
  if (!isRecord(value) || !isRecord(value.meta)) throw new Error("Meta de fixture absente.");
  value.meta.stage = stage;
  return value;
}

function slide(value: unknown, id: string): UnknownRecord {
  if (!isRecord(value) || !Array.isArray(value.slides)) throw new Error("Slides de fixture absentes.");
  const match = value.slides.find((entry) => isRecord(entry) && entry.id === id);
  if (!isRecord(match)) throw new Error(`Slide ${id} absente.`);
  return match;
}

function issueCodes(value: unknown): string[] {
  return validateDossier(value).map((entry) => entry.code);
}

function replaceClaim(target: UnknownRecord, contentPath: string, text: string): void {
  target.claims = [{ text, kind: "proposal", contentPath }];
}

function updateClaimText(target: UnknownRecord, contentPath: string, text: string): void {
  if (!Array.isArray(target.claims)) throw new Error("Claims de fixture absents.");
  target.claims = target.claims.map((claim) => {
    if (!isRecord(claim) || claim.contentPath !== contentPath) return claim;
    return { ...claim, text };
  });
}

const sampleIssues = validateDossier(exampleDossier);
assert.equal(sampleIssues.filter((entry) => entry.level === "error").length, 0);
exampleDossier.slides.forEach((entry) => {
  const expected = substantiveContentEntries(entry).map((item) => item.path).sort();
  const actual = (entry.claims ?? []).map((claim) => claim.contentPath).sort();
  assert.deepEqual(actual, expected, `Couverture finale incomplète sur ${entry.id}.`);
});

const riskSlide = exampleDossier.slides.find((entry) => entry.id === "06-risque");
if (!riskSlide || riskSlide.type !== "risk") throw new Error("Slide de risque absente.");
assert.equal(resolveSlideContentPath(riskSlide, "risks[0].consequence"), riskSlide.risks[0]?.consequence);
assert.equal(resolveSlideContentPath(riskSlide, "slides[0].title"), undefined);
assert.equal(resolveSlideContentPath(riskSlide, "__proto__.title"), undefined);
assert.ok(claimMatchesTarget("42 cas documentés", { value: "42", label: "Cas documentés" }));
assert.ok(!claimMatchesTarget("42 résultats", { value: "42", label: "Cas documentés" }));

const normalizedMatch = clone();
const normalizedRisk = slide(normalizedMatch, "06-risque");
normalizedRisk.counterpoint = "Texte   cible";
replaceClaim(normalizedRisk, "counterpoint", "texte cible");
assert.ok(!issueCodes(normalizedMatch).includes("claim-content-mismatch"));

const invalidPath = clone();
replaceClaim(slide(invalidPath, "06-risque"), "missing.path", "Texte absent");
assert.ok(issueCodes(invalidPath).includes("claim-content-path"));

const absolutePath = clone();
replaceClaim(slide(absolutePath, "06-risque"), "slides[0].title", "Titre absolu");
assert.ok(issueCodes(absolutePath).includes("claim-content-path"));

const technicalPath = clone();
replaceClaim(slide(technicalPath, "06-risque"), "id", "06-risque");
assert.ok(issueCodes(technicalPath).includes("claim-content-path"));

const wrongText = clone();
replaceClaim(slide(wrongText, "06-risque"), "title", "Un autre titre");
assert.ok(issueCodes(wrongText).includes("claim-content-mismatch"));

const incompleteFinal = clone("final");
const incompleteRisk = slide(incompleteFinal, "06-risque");
if (!Array.isArray(incompleteRisk.claims)) throw new Error("Claims de risque absents.");
incompleteRisk.claims = incompleteRisk.claims.filter((claim) =>
  !isRecord(claim) || claim.contentPath !== "title",
);
assert.ok(issueCodes(incompleteFinal).includes("claim-coverage"));

const incompleteDraft = clone();
delete slide(incompleteDraft, "06-risque").claims;
assert.ok(!issueCodes(incompleteDraft).includes("claim-coverage"));

const objectiveWithoutSource = clone();
const objectiveRisk = slide(objectiveWithoutSource, "06-risque");
objectiveRisk.counterpoint = "Fait sans preuve";
objectiveRisk.claims = [{
  text: "Fait sans preuve",
  kind: "fact",
  contentPath: "counterpoint",
  evidenceIds: [],
}];
assert.ok(issueCodes(objectiveWithoutSource).includes("claim-source"));

const placeholderCases = [
  "Texte TODO final",
  "Décision tBd",
  "Visuel TBC",
  "Lorem ipsum",
  "PLACEHOLDER visuel",
  "[Insert visual]",
  "À compléter",
] as const;
placeholderCases.forEach((token) => {
  const dossier = clone("final");
  const target = slide(dossier, "06-risque");
  target.title = token;
  updateClaimText(target, "title", token);
  assert.ok(issueCodes(dossier).includes("final-placeholder"), `Token non détecté: ${token}`);
});

const draftPlaceholder = clone();
const draftRisk = slide(draftPlaceholder, "06-risque");
draftRisk.title = "TODO";
delete draftRisk.claims;
assert.ok(!issueCodes(draftPlaceholder).includes("final-placeholder"));

const thankYouSlide = exampleDossier.slides.find((entry) => entry.id === "17-merci");
assert.ok(thankYouSlide?.type === "thank-you");
assert.ok(substantiveContentEntries(thankYouSlide).some((entry) => entry.path === "contact.website"));
assert.ok(thankYouSlide.claims?.some((claim) => claim.contentPath === "contact.website"));

const missingWebsiteClaim = clone("final");
const missingWebsiteThankYou = slide(missingWebsiteClaim, "17-merci");
if (!Array.isArray(missingWebsiteThankYou.claims)) throw new Error("Claims de contact absents.");
missingWebsiteThankYou.claims = missingWebsiteThankYou.claims.filter((claim) =>
  !isRecord(claim) || claim.contentPath !== "contact.website",
);
assert.ok(issueCodes(missingWebsiteClaim).includes("claim-coverage"));

const placeholderWebsite = clone("final");
const placeholderThankYou = slide(placeholderWebsite, "17-merci");
if (!isRecord(placeholderThankYou.contact)) throw new Error("Contact de fixture absent.");
placeholderThankYou.contact.website = "https://todo.invalid";
updateClaimText(placeholderThankYou, "contact.website", "https://todo.invalid");
assert.ok(issueCodes(placeholderWebsite).includes("final-placeholder"));

const forbiddenWebsite = clone("final");
if (!isRecord(forbiddenWebsite) || !isRecord(forbiddenWebsite.meta)) throw new Error("Meta de fixture absente.");
forbiddenWebsite.meta.forbiddenClientTerms = ["client-officiel"];
const forbiddenThankYou = slide(forbiddenWebsite, "17-merci");
if (!isRecord(forbiddenThankYou.contact)) throw new Error("Contact de fixture absent.");
forbiddenThankYou.contact.website = "https://client-officiel.invalid";
updateClaimText(forbiddenThankYou, "contact.website", "https://client-officiel.invalid");
assert.ok(issueCodes(forbiddenWebsite).includes("forbidden-client-term"));

const a11yPlaceholder = clone("final");
const a11yProof = slide(a11yPlaceholder, "04-preuves");
if (!isRecord(a11yProof.image)) throw new Error("Image de fixture absente.");
a11yProof.image.alt = "TODO client officiel";
const a11yIssues = validateDossier(a11yPlaceholder);
assert.ok(a11yIssues.some((entry) => entry.code === "final-placeholder" && entry.path.endsWith("image.alt")));
assert.ok(a11yIssues.some((entry) => entry.code === "forbidden-client-term" && entry.path.endsWith("image.alt")));
assert.ok(!a11yIssues.some((entry) => entry.code === "claim-coverage" && entry.path.endsWith("image.alt")));

for (const key of ["timecode", "number"] as const) {
  const structuralPlaceholder = clone("final");
  const structuralStoryboard = slide(structuralPlaceholder, "13-storyboard-serie");
  if (!Array.isArray(structuralStoryboard.frames) || !isRecord(structuralStoryboard.frames[0])) {
    throw new Error("Storyboard de fixture absent.");
  }
  structuralStoryboard.frames[0][key] = "TODO client officiel";
  const structuralIssues = validateDossier(structuralPlaceholder);
  assert.ok(structuralIssues.some((entry) => entry.code === "final-placeholder" && entry.path.endsWith(`.${key}`)));
  assert.ok(structuralIssues.some((entry) => entry.code === "forbidden-client-term" && entry.path.endsWith(`.${key}`)));
}

const structuralIndex = clone("final");
const columns = slide(structuralIndex, "03-pourquoi-maintenant").columns;
if (!Array.isArray(columns) || !isRecord(columns[0])) throw new Error("Colonnes de fixture absentes.");
columns[0].index = "TODO client officiel";
assert.ok(issueCodes(structuralIndex).includes("final-placeholder"));
assert.ok(issueCodes(structuralIndex).includes("forbidden-client-term"));

for (const themeField of ["textFallback", "runningHeader", "alt"] as const) {
  const themePlaceholder = clone("final");
  if (!isRecord(themePlaceholder) || !isRecord(themePlaceholder.theme)) throw new Error("Thème absent.");
  const theme = themePlaceholder.theme;
  if (themeField === "textFallback" && isRecord(theme.logo)) theme.logo.textFallback = "TODO client officiel";
  if (themeField === "runningHeader" && isRecord(theme.chrome) && isRecord(theme.chrome.runningHeader)) {
    theme.chrome.runningHeader.text = "TODO client officiel";
  }
  if (themeField === "alt" && isRecord(theme.motif) && isRecord(theme.motif.assets)
    && isRecord(theme.motif.assets.full)) theme.motif.assets.full.alt = "TODO client officiel";
  const themeIssues = validateDossier(themePlaceholder);
  assert.ok(themeIssues.some((entry) => entry.code === "final-placeholder" && entry.path.startsWith("theme.")));
  assert.ok(themeIssues.some((entry) => entry.code === "forbidden-client-term" && entry.path.startsWith("theme.")));
}

const remoteStoryboard = clone("final");
const storyboard = slide(remoteStoryboard, "11-storyboard-hero");
if (!Array.isArray(storyboard.frames) || !isRecord(storyboard.frames[0])) {
  throw new Error("Storyboard de fixture absent.");
}
const firstImage = storyboard.frames[0].image;
if (!isRecord(firstImage)) throw new Error("Image de storyboard absente.");
firstImage.src = "https://example.com/frame.png";
assert.ok(issueCodes(remoteStoryboard).includes("final-storyboard-image"));

const typedRisk = riskSlide as DossierSlide;
assert.ok(substantiveContentEntries(typedRisk).some((entry) => entry.path === "risks[0].consequence"));

console.log("Tests claims: chemins relatifs, couverture finale, sources et tokens provisoires validés.");
