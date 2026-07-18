import type { ValidationIssue } from "./validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function evidenceReferences(slide: UnknownRecord, slideIndex: number): Array<readonly [unknown, string]> {
  const references: Array<readonly [unknown, string]> = [];
  if (Array.isArray(slide.evidenceIds)) {
    slide.evidenceIds.forEach((id, index) => references.push([
      id,
      `slides[${slideIndex}].evidenceIds[${index}]`,
    ]));
  }
  if (Array.isArray(slide.claims)) slide.claims.forEach((claim, claimIndex) => {
    if (!isRecord(claim) || !Array.isArray(claim.evidenceIds)) return;
    claim.evidenceIds.forEach((id, idIndex) => references.push([
      id,
      `slides[${slideIndex}].claims[${claimIndex}].evidenceIds[${idIndex}]`,
    ]));
  });
  return references;
}

export function validateFinalEvidenceVisibility(
  meta: UnknownRecord | undefined,
  slides: unknown,
  registry: ReadonlyMap<string, UnknownRecord>,
  issues: ValidationIssue[],
): void {
  if (meta?.stage !== "final" || !Array.isArray(slides)) return;
  slides.forEach((slide, slideIndex) => {
    if (!isRecord(slide)) return;
    evidenceReferences(slide, slideIndex).forEach(([id, path]) => {
      if (typeof id === "string" && registry.get(id)?.status === "internal-only") {
        issues.push({
          level: "error",
          code: "evidence-private-final",
          path,
          message: "Une preuve internal-only ne peut pas être liée à un dossier final distribuable.",
        });
      }
    });
  });
}
