import type { DossierSlide } from "./types";
import type { ValidationIssue } from "./validation";
import {
  claimableContentEntries,
  claimMatchesTarget,
  structuralAuditStrings,
  resolveSlideContentPath,
  substantiveContentEntries,
  clientFacingAuditStrings,
} from "./content-claims";

type UnknownRecord = Record<string, unknown>;

const placeholderPatterns: ReadonlyArray<readonly [string, RegExp]> = [
  ["TODO", /\btodo\b/],
  ["TBD", /\btbd\b/],
  ["TBC", /\btbc\b/],
  ["lorem", /\blorem\b/],
  ["placeholder", /\bplaceholder\b/],
  ["[insert", /\[insert/],
  ["à compléter", /\ba completer\b/],
];

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function error(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

function normalizedForScan(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

function validatePlaceholderEntries(
  entries: readonly { readonly path: string; readonly value: string }[],
  basePath: string,
  issues: ValidationIssue[],
): void {
  entries.forEach((entry) => {
    const value = normalizedForScan(entry.value);
    placeholderPatterns.forEach(([label, pattern]) => {
      if (pattern.test(value)) {
        error(issues, "final-placeholder", `${basePath}.${entry.path}`, `Token provisoire interdit en final: ${label}.`);
      }
    });
  });
}

function validateFinalStoryboard(slide: UnknownRecord, path: string, issues: ValidationIssue[]): void {
  if (slide.type !== "storyboard" || !Array.isArray(slide.frames)) return;
  slide.frames.forEach((frame, index) => {
    const image = isRecord(frame) ? frame.image : undefined;
    const src = isRecord(image) ? image.src : undefined;
    const remote = typeof src === "string" && /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src)
      && !src.startsWith("data:image/");
    if (typeof src !== "string" || src.trim().length === 0 || remote) {
      error(
        issues,
        "final-storyboard-image",
        `${path}.frames[${index}].image`,
        "Chaque frame finale exige une image locale.",
      );
    }
  });
}

function validateSlideClaims(
  slide: UnknownRecord,
  path: string,
  final: boolean,
  issues: ValidationIssue[],
): void {
  const typedSlide = slide as unknown as DossierSlide;
  const claimable = new Map(claimableContentEntries(typedSlide).map((entry) => [entry.path, entry.value]));
  const covered = new Set<string>();
  if (Array.isArray(slide.claims)) {
    slide.claims.forEach((claim, index) => {
      if (!isRecord(claim)) return;
      const claimPath = `${path}.claims[${index}]`;
      if (typeof claim.contentPath !== "string" || claim.contentPath.trim().length === 0) {
        error(issues, "claim-content-path", `${claimPath}.contentPath`, "Chemin relatif à la slide requis.");
        return;
      }
      const target = claimable.get(claim.contentPath);
      const resolved = resolveSlideContentPath(typedSlide, claim.contentPath);
      if (target === undefined || resolved === undefined) {
        error(issues, "claim-content-path", `${claimPath}.contentPath`, "Le chemin ne pointe pas vers un texte client.");
        return;
      }
      if (typeof claim.text !== "string" || !claimMatchesTarget(claim.text, target)) {
        error(issues, "claim-content-mismatch", `${claimPath}.text`, "Le claim doit reprendre exactement le texte ciblé.");
        return;
      }
      covered.add(claim.contentPath);
    });
  }
  if (!final) return;
  substantiveContentEntries(typedSlide).forEach((entry) => {
    if (!covered.has(entry.path)) {
      error(issues, "claim-coverage", `${path}.${entry.path}`, `Claim requis pour le champ ${entry.path}.`);
    }
  });
  validateFinalStoryboard(slide, path, issues);
  validatePlaceholderEntries(clientFacingAuditStrings(typedSlide), path, issues);
}

export function validateContentClaims(value: UnknownRecord, issues: ValidationIssue[]): void {
  const final = isRecord(value.meta) && value.meta.stage === "final";
  if (!Array.isArray(value.slides)) return;
  value.slides.forEach((slide, index) => {
    if (isRecord(slide)) validateSlideClaims(slide, `slides[${index}]`, final, issues);
  });
  if (final) validatePlaceholderEntries(structuralAuditStrings(value.theme), "theme", issues);
}
