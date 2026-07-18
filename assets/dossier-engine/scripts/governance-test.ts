import assert from "node:assert/strict";
import { exampleDossier } from "../src/content/example";
import { validateDossier } from "../src/schema/validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone(): unknown {
  const value: unknown = structuredClone(exampleDossier);
  meta(value).stage = "draft";
  return value;
}

function meta(value: unknown): UnknownRecord {
  if (!isRecord(value) || !isRecord(value.meta)) throw new Error("Meta de fixture absente.");
  return value.meta;
}

function slide(value: unknown, type: string): UnknownRecord {
  if (!isRecord(value) || !Array.isArray(value.slides)) throw new Error("Slides de fixture absentes.");
  const match = value.slides.find((entry) => isRecord(entry) && entry.type === type);
  if (!isRecord(match)) throw new Error(`Slide ${type} absente.`);
  return match;
}

function references(value: unknown): UnknownRecord[] {
  const items = slide(value, "references").references;
  if (!Array.isArray(items)) throw new Error("Références de fixture absentes.");
  return items.filter(isRecord);
}

function hasIssue(value: unknown, code: string): boolean {
  return validateDossier(value).some((entry) => entry.code === code);
}

function addClaim(value: unknown, claim: UnknownRecord): void {
  const target = slide(value, "risk");
  if (typeof claim.text === "string") target.counterpoint = claim.text;
  target.claims = [{ ...claim, contentPath: "counterpoint" }];
}

function appendEvidence(value: unknown, entries: readonly UnknownRecord[]): void {
  if (!isRecord(value) || !Array.isArray(value.evidence)) throw new Error("Registre de preuves absent.");
  value.evidence = [...value.evidence, ...entries];
}

assert.equal(exampleDossier.meta.distributionMode, "private-prospecting");
assert.equal(exampleDossier.meta.relationshipStatus, "independent-proposal");
assert.equal(exampleDossier.meta.generativeAssets, "forbidden");
assert.equal(exampleDossier.meta.stage, "final");
assert.deepEqual(exampleDossier.evidence.map((entry) => entry.id), [
  "fixture:context-audit",
  "fixture:vector-assets",
  "fixture:contact-card",
]);

const missingGovernance = clone();
delete meta(missingGovernance).distributionMode;
assert.ok(hasIssue(missingGovernance, "governance-enum"));

const missingRegistry = clone();
if (isRecord(missingRegistry)) delete missingRegistry.evidence;
assert.ok(hasIssue(missingRegistry, "evidence-required"));

const missingCoverLabel = clone();
delete slide(missingCoverLabel, "cover").relationshipLabel;
assert.ok(hasIssue(missingCoverLabel, "relationship-label"));

const barePairing = clone();
slide(barePairing, "cover").relationshipLabel = "Prospect Démo × Studio Démo";
assert.ok(hasIssue(barePairing, "relationship-label"));

const optionalStudio = clone();
delete meta(optionalStudio).studio;
delete slide(optionalStudio, "lockup").studio;
slide(optionalStudio, "cover").relationshipLabel = "Proposition indépendante pour Prospect Démo";
slide(optionalStudio, "lockup").relationshipLabel = "Proposition indépendante pour Prospect Démo";
assert.equal(validateDossier(optionalStudio).filter((entry) => entry.level === "error").length, 0);

const omittedStudioInLabel = clone();
slide(omittedStudioInLabel, "cover").relationshipLabel = "Proposition indépendante pour Prospect Démo";
assert.ok(hasIssue(omittedStudioInLabel, "relationship-label"));

const missingCover = clone();
if (isRecord(missingCover) && Array.isArray(missingCover.slides)) {
  missingCover.slides = missingCover.slides.filter((entry) => !isRecord(entry) || entry.type !== "cover");
}
assert.ok(hasIssue(missingCover, "relationship-slide"));

const approvedRelationship = clone();
meta(approvedRelationship).relationshipStatus = "client-approved";
delete slide(approvedRelationship, "cover").relationshipLabel;
delete slide(approvedRelationship, "lockup").relationshipLabel;
assert.ok(!hasIssue(approvedRelationship, "relationship-label"));

const unknownEvidence = clone();
addClaim(unknownEvidence, { text: "Fait inconnu", kind: "fact", evidenceIds: ["evidence:missing"] });
assert.ok(hasIssue(unknownEvidence, "evidence-unknown"));

const unknownSlideEvidence = clone();
slide(unknownSlideEvidence, "risk").evidenceIds = ["evidence:missing"];
assert.ok(hasIssue(unknownSlideEvidence, "evidence-unknown"));

const rejectedFact = clone();
appendEvidence(rejectedFact, [
  { id: "fact:01", kind: "fact", status: "needs-check", claim: "Fait à confirmer" },
]);
addClaim(rejectedFact, { text: "Fait à confirmer", kind: "fact", evidenceIds: ["fact:01"] });
assert.ok(hasIssue(rejectedFact, "evidence-unusable"));

const internalQuote = clone();
appendEvidence(internalQuote, [
  { id: "quote:01", kind: "quote", status: "internal-only", claim: "Citation interne" },
]);
addClaim(internalQuote, { text: "Citation interne", kind: "quote", evidenceIds: ["quote:01"] });
assert.ok(hasIssue(internalQuote, "evidence-unusable"));

const verifiedFact = clone();
appendEvidence(verifiedFact, [
  { id: "fact:verified", kind: "fact", status: "verified", claim: "Fait vérifié" },
]);
addClaim(verifiedFact, { text: "Fait vérifié", kind: "fact", evidenceIds: ["fact:verified"] });
assert.equal(validateDossier(verifiedFact).filter((entry) => entry.level === "error").length, 0);

const interpretedFact = clone();
appendEvidence(interpretedFact, [
  { id: "fact:context", kind: "fact", status: "needs-check", claim: "Contexte à interpréter" },
]);
addClaim(interpretedFact, { text: "Lecture du contexte", kind: "interpretation", evidenceIds: ["fact:context"] });
assert.ok(!hasIssue(interpretedFact, "evidence-kind-mismatch"));
assert.ok(!hasIssue(interpretedFact, "evidence-unusable"));

const proposalFromObservation = clone();
appendEvidence(proposalFromObservation, [
  { id: "observation:usable", kind: "observation", status: "internal-only", claim: "Signal interne" },
]);
addClaim(proposalFromObservation, { text: "Piste créative", kind: "proposal", evidenceIds: ["observation:usable"] });
assert.ok(!hasIssue(proposalFromObservation, "evidence-kind-mismatch"));
assert.ok(!hasIssue(proposalFromObservation, "evidence-unusable"));

const rejectedProposal = clone();
appendEvidence(rejectedProposal, [
  { id: "fact:rejected", kind: "fact", status: "rejected", claim: "Fait rejeté" },
]);
addClaim(rejectedProposal, { text: "Piste rejetée", kind: "proposal", evidenceIds: ["fact:rejected"] });
assert.ok(hasIssue(rejectedProposal, "evidence-unusable"));

const emptyObjectiveEvidence = clone();
addClaim(emptyObjectiveEvidence, { text: "Fait sans preuve", kind: "fact", evidenceIds: [] });
assert.ok(hasIssue(emptyObjectiveEvidence, "claim-source"));

const mismatchedEvidence = clone();
appendEvidence(mismatchedEvidence, [
  { id: "observation:01", kind: "observation", status: "verified", claim: "Observation" },
]);
addClaim(mismatchedEvidence, { text: "Fait", kind: "fact", evidenceIds: ["observation:01"] });
assert.ok(hasIssue(mismatchedEvidence, "evidence-kind-mismatch"));

const duplicateEvidence = clone();
appendEvidence(duplicateEvidence, [
  { id: "duplicate", kind: "proposal", status: "internal-only", claim: "A" },
  { id: "duplicate", kind: "proposal", status: "internal-only", claim: "B" },
]);
assert.ok(hasIssue(duplicateEvidence, "evidence-duplicate"));

const invalidEvidenceUrl = clone();
appendEvidence(invalidEvidenceUrl, [
  { id: "source:01", kind: "proposal", status: "verified", claim: "Source", sourceUrl: "pas une URL" },
]);
assert.ok(hasIssue(invalidEvidenceUrl, "evidence-url"));

const forbiddenTerm = clone();
meta(forbiddenTerm).forbiddenClientTerms = ["COLLABORATION OFFICIELLE"];
slide(forbiddenTerm, "risk").lead = "Cette collaboration officielle n'existe pas.";
assert.ok(hasIssue(forbiddenTerm, "forbidden-client-term"));

const missingReferenceSource = clone();
delete references(missingReferenceSource)[0]?.source;
assert.ok(validateDossier(missingReferenceSource).some((entry) =>
  entry.path.endsWith("references[0].source"),
));

const invalidReferenceUrl = clone();
const invalidReference = references(invalidReferenceUrl)[0];
if (invalidReference) invalidReference.url = "source locale";
assert.ok(hasIssue(invalidReferenceUrl, "reference-url"));

const validReferenceUrl = clone();
const validReference = references(validReferenceUrl)[0];
if (validReference) validReference.url = "https://example.com/reference";
assert.ok(!hasIssue(validReferenceUrl, "reference-url"));

console.log("Tests gouvernance: relation, preuves, vocabulaire et références validés.");
