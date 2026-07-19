import type { Dossier } from "./types.js";
import { validateAssetGovernance } from "./asset-validation";
import { validateBlackFlowerProfile } from "./black-flower-validation";
import { validateContentClaims } from "./claim-validation";
import { validateFontContract } from "./font-validation";
import { validateGovernance } from "./governance-validation";
import { validateNestedDossier } from "./validation-nested";
import { validateProofEvidence } from "./proof-validation";
import { validateTextLimits } from "./text-validation";

export interface ValidationIssue {
  level: "error" | "warning";
  code: string;
  path: string;
  message: string;
}

type UnknownRecord = Record<string, unknown>;

const slideTypes = new Set([
  "cover",
  "architecture",
  "three-columns",
  "manifesto",
  "proof",
  "risk",
  "opportunity",
  "platform",
  "timeline",
  "film-concept",
  "activation",
  "storyboard",
  "production",
  "references",
  "thank-you",
  "lockup",
]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function issue(
  issues: ValidationIssue[],
  level: ValidationIssue["level"],
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ level, code, path, message });
}

function requireRecord(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is UnknownRecord {
  if (isRecord(value)) return true;
  issue(issues, "error", "shape", path, "Objet requis.");
  return false;
}

function requireString(record: UnknownRecord, key: string, path: string, issues: ValidationIssue[]): void {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    issue(issues, "error", "required-text", `${path}.${key}`, "Texte non vide requis.");
  }
}

function requireArray(
  record: UnknownRecord,
  key: string,
  path: string,
  issues: ValidationIssue[],
  bounds: readonly [number, number] = [1, 12],
): void {
  const value = record[key];
  if (!Array.isArray(value)) {
    issue(issues, "error", "required-array", `${path}.${key}`, "Liste requise.");
    return;
  }
  if (value.length < bounds[0] || value.length > bounds[1]) {
    issue(
      issues,
      "error",
      "array-size",
      `${path}.${key}`,
      `Entre ${bounds[0]} et ${bounds[1]} éléments requis.`,
    );
  }
}

function validateVariant(
  slide: UnknownRecord,
  allowed: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  if (typeof slide.variant !== "string" || !allowed.includes(slide.variant)) {
    issue(issues, "error", "variant", `${path}.variant`, `Valeur attendue: ${allowed.join(" ou ")}.`);
  }
}

function validateSlide(slide: UnknownRecord, path: string, issues: ValidationIssue[]): void {
  requireString(slide, "id", path, issues);
  requireString(slide, "type", path, issues);
  const type = slide.type;
  if (typeof type !== "string" || !slideTypes.has(type)) {
    issue(issues, "error", "slide-type", `${path}.type`, "Famille de slide inconnue.");
    return;
  }
  if (type !== "lockup") requireString(slide, "title", path, issues);
  if (slide.evidenceIds !== undefined) requireArray(slide, "evidenceIds", path, issues, [1, 20]);
  if (slide.claims !== undefined) requireArray(slide, "claims", path, issues, [1, 120]);
  switch (type) {
    case "cover":
      ["client", "subtitle", "proposition"].forEach((key) => requireString(slide, key, path, issues));
      break;
    case "architecture":
      requireString(slide, "statement", path, issues);
      requireArray(slide, "nodes", path, issues, [3, 6]);
      break;
    case "three-columns":
      validateVariant(slide, ["why-now", "pillars"], path, issues);
      requireArray(slide, "columns", path, issues, [3, 3]);
      break;
    case "manifesto":
      requireArray(slide, "lines", path, issues, [3, 8]);
      break;
    case "proof":
      validateProofEvidence(slide, path, issues);
      break;
    case "risk":
      requireString(slide, "lead", path, issues);
      requireArray(slide, "risks", path, issues, [2, 5]);
      break;
    case "opportunity":
      validateVariant(slide, ["opportunity", "shifts"], path, issues);
      requireArray(slide, "shifts", path, issues, [2, 5]);
      break;
    case "platform":
      validateVariant(slide, ["platform", "system"], path, issues);
      requireRecord(slide.core, `${path}.core`, issues);
      requireArray(slide, "layers", path, issues, [2, 6]);
      break;
    case "timeline":
      validateVariant(slide, ["timeline", "method"], path, issues);
      requireArray(slide, "steps", path, issues, [3, 6]);
      break;
    case "film-concept":
      ["conceptName", "logline", "format", "duration"].forEach((key) =>
        requireString(slide, key, path, issues),
      );
      requireArray(slide, "toneWords", path, issues, [2, 6]);
      break;
    case "activation":
      requireString(slide, "lead", path, issues);
      requireArray(slide, "channels", path, issues, [2, 6]);
      break;
    case "storyboard":
      requireArray(slide, "frames", path, issues, [3, 12]);
      if (slide.duration !== undefined) requireString(slide, "duration", path, issues);
      break;
    case "production":
      requireString(slide, "lead", path, issues);
      if (slide.variant === "black-flower-portrait") {
        ["role", "strength", "portraitCaption"].forEach((key) => requireString(slide, key, path, issues));
        requireArray(slide, "approach", path, issues, [3, 5]);
        requireRecord(slide.image, `${path}.image`, issues);
      } else {
        requireArray(slide, "workstreams", path, issues, [2, 6]);
        requireArray(slide, "deliverables", path, issues, [2, 10]);
      }
      break;
    case "references":
      requireArray(slide, "references", path, issues, [2, 8]);
      break;
    case "thank-you":
      if (slide.variant === "black-flower-letter") {
        requireArray(slide, "paragraphs", path, issues, [3, 4]);
        ["closing", "signature", "platform"].forEach((key) => requireString(slide, key, path, issues));
      } else {
        requireString(slide, "message", path, issues);
        if (slide.contact !== undefined) requireRecord(slide.contact, `${path}.contact`, issues);
      }
      break;
    case "lockup":
      requireString(slide, "client", path, issues);
      if (slide.variant === "black-flower-co-mark") {
        requireRecord(slide.clientMark, `${path}.clientMark`, issues);
        requireRecord(slide.studioMark, `${path}.studioMark`, issues);
      } else if (slide.studio !== undefined) requireString(slide, "studio", path, issues);
      break;
  }
}

function normalizedOutputId(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64);
}

export function validateDossier(value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!requireRecord(value, "dossier", issues)) return issues;
  if (!requireRecord(value.meta, "meta", issues)) return issues;
  ["title", "client", "language", "version", "date"].forEach((key) =>
    requireString(value.meta as UnknownRecord, key, "meta", issues),
  );
  if (!requireRecord(value.theme, "theme", issues)) return issues;
  ["name", "palette", "typography", "motif", "logo"].forEach((key) => {
    if (!(key in (value.theme as UnknownRecord))) issue(issues, "error", "theme", `theme.${key}`, "Champ requis.");
  });
  if (!Array.isArray(value.slides)) {
    issue(issues, "error", "slides", "slides", "Liste de slides requise.");
    return issues;
  }
  if (value.slides.length < 1 || value.slides.length > 30) {
    issue(issues, "error", "slide-count", "slides", "Le dossier doit contenir entre 1 et 30 slides.");
  }
  const ids = new Set<string>();
  const outputIds = new Map<string, string>();
  value.slides.forEach((entry, index) => {
    const path = `slides[${index}]`;
    if (!requireRecord(entry, path, issues)) return;
    validateSlide(entry, path, issues);
    if (typeof entry.id === "string") {
      if (ids.has(entry.id)) issue(issues, "error", "duplicate-id", `${path}.id`, "Identifiant dupliqué.");
      ids.add(entry.id);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
        issue(issues, "error", "slide-id-format", `${path}.id`, "Identifiant ASCII kebab-case requis, par exemple 01-cover.");
      }
      const outputId = normalizedOutputId(entry.id);
      const existing = outputIds.get(outputId);
      if (existing !== undefined && existing !== entry.id) {
        issue(issues, "error", "slide-id-output-collision", `${path}.id`, `Collision de nom de sortie avec ${existing}.`);
      } else outputIds.set(outputId, entry.id);
    }
  });
  validateNestedDossier(value, issues);
  validateFontContract(value, issues);
  validateGovernance(value, issues);
  validateAssetGovernance(value, issues);
  validateBlackFlowerProfile(value, issues);
  validateContentClaims(value, issues);
  validateTextLimits(value, issues);
  return issues;
}

export function assertDossier(value: unknown): asserts value is Dossier {
  const errors = validateDossier(value).filter((entry) => entry.level === "error");
  if (errors.length > 0) {
    throw new Error(errors.map((entry) => `${entry.path}: ${entry.message}`).join("\n"));
  }
}
