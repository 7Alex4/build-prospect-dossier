import type { ValidationIssue } from "./validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function error(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

function validateSet(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  minimum: number,
  maximum: number,
): void {
  if (!Array.isArray(value)) {
    error(issues, "required-array", path, "Liste requise.");
    return;
  }
  if (value.length < minimum || value.length > maximum) {
    error(issues, "array-size", path, `Entre ${minimum} et ${maximum} éléments requis.`);
  }
}

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("fr").replace(/\s+/g, " ").trim();
}

function claimRecords(slide: UnknownRecord): UnknownRecord[] {
  return Array.isArray(slide.claims) ? slide.claims.filter(isRecord) : [];
}

function hasEvidenceIds(value: unknown): boolean {
  return Array.isArray(value) && value.some((entry) => typeof entry === "string" && entry.trim().length > 0);
}

function metricCovered(metric: UnknownRecord, claims: readonly UnknownRecord[]): boolean {
  if (typeof metric.value !== "string" || typeof metric.label !== "string") return false;
  const value = normalized(metric.value);
  const label = normalized(metric.label);
  return claims.some((claim) => {
    if (claim.kind !== "fact" || typeof claim.text !== "string") return false;
    const text = normalized(claim.text);
    return text.includes(value) && text.includes(label) && hasEvidenceIds(claim.evidenceIds);
  });
}

function quoteCovered(quote: string, claims: readonly UnknownRecord[]): boolean {
  const expected = normalized(quote);
  return claims.some((claim) =>
    claim.kind === "quote"
    && typeof claim.text === "string"
    && normalized(claim.text).includes(expected)
    && hasEvidenceIds(claim.evidenceIds),
  );
}

export function validateProofEvidence(
  slide: UnknownRecord,
  path: string,
  issues: ValidationIssue[],
): void {
  if (slide.metrics !== undefined) validateSet(slide.metrics, `${path}.metrics`, issues, 2, 5);
  if (slide.proofPoints !== undefined) validateSet(slide.proofPoints, `${path}.proofPoints`, issues, 2, 5);
  if (!Array.isArray(slide.metrics) && !Array.isArray(slide.proofPoints)) {
    error(issues, "proof-evidence", path, "Deux métriques ou deux preuves qualitatives au minimum sont requises.");
  }
  const factual = slide.metrics !== undefined || slide.quote !== undefined;
  const claims = claimRecords(slide);
  const slideSourced = hasEvidenceIds(slide.evidenceIds);
  const claimSourced = claims.some((claim) => hasEvidenceIds(claim.evidenceIds));
  if (factual && !slideSourced && !claimSourced) {
    error(issues, "proof-source", `${path}.claims`, "Une métrique ou citation doit référencer une preuve sourcée.");
  }
  if (Array.isArray(slide.metrics)) {
    slide.metrics.forEach((metric, index) => {
      if (isRecord(metric) && !metricCovered(metric, claims)) {
        error(issues, "proof-claim", `${path}.metrics[${index}]`, "Claim factuel sourcé correspondant requis.");
      }
    });
  }
  if (typeof slide.quote === "string" && !quoteCovered(slide.quote, claims)) {
    error(issues, "proof-claim", `${path}.quote`, "Claim de citation sourcé correspondant requis.");
  }
}
