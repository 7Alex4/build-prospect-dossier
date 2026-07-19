import type { ValidationIssue } from "./validation";

type UnknownRecord = Record<string, unknown>;

const roles = [
  "hero", "evidence", "editorial", "product", "portrait", "film-still",
  "storyboard-frame", "reference", "background", "motif", "identity",
] as const;
const natures = [
  "photograph", "product-cutout", "screenshot", "document", "archive",
  "illustration", "storyboard", "portrait", "texture", "brand-mark",
] as const;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

function allowed(value: unknown, values: readonly string[], path: string, issues: ValidationIssue[]): void {
  if (typeof value !== "string" || !values.includes(value)) {
    add(issues, "enum", path, `Valeur attendue: ${values.join(", ")}.`);
  }
}

function finiteNumber(value: unknown, path: string, issues: ValidationIssue[], min: number, max: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    add(issues, "image-number", path, `Nombre requis entre ${min} et ${max}.`);
  }
}

function dimensions(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    add(issues, "image-dimensions", path, "Objet dimensions requis.");
    return;
  }
  finiteNumber(value.width, `${path}.width`, issues, 1, 20000);
  finiteNumber(value.height, `${path}.height`, issues, 1, 20000);
}

function safeBox(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    add(issues, "image-safe-box", path, "Objet safe box requis.");
    return;
  }
  ["x", "y", "width", "height"].forEach((key) =>
    finiteNumber(value[key], `${path}.${key}`, issues, 0, 1),
  );
  if (typeof value.x === "number" && typeof value.width === "number" && value.x + value.width > 1) {
    add(issues, "image-safe-box", path, "La safe box dépasse la largeur de l'image.");
  }
  if (typeof value.y === "number" && typeof value.height === "number" && value.y + value.height > 1) {
    add(issues, "image-safe-box", path, "La safe box dépasse la hauteur de l'image.");
  }
}

export function validateImageShape(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    add(issues, "image-shape", path, "Objet image requis.");
    return;
  }
  ["src", "alt"].forEach((key) => {
    if (typeof value[key] !== "string" || value[key].trim().length === 0) {
      add(issues, "nested-text", `${path}.${key}`, "Texte non vide requis.");
    }
  });
  if (value.fit !== undefined) allowed(value.fit, ["cover", "contain"], `${path}.fit`, issues);
  if (value.treatment !== undefined) {
    allowed(value.treatment, ["natural", "mono", "duotone"], `${path}.treatment`, issues);
  }
  if (value.mediaRole !== undefined) allowed(value.mediaRole, roles, `${path}.mediaRole`, issues);
  if (value.mediaNature !== undefined) allowed(value.mediaNature, natures, `${path}.mediaNature`, issues);
  if (value.productionStatus !== undefined) {
    allowed(value.productionStatus, ["final", "placeholder"], `${path}.productionStatus`, issues);
  }
  if (value.presentation !== undefined) {
    allowed(value.presentation, ["frame", "cutout", "background"], `${path}.presentation`, issues);
  }
  dimensions(value.sourceDimensions, `${path}.sourceDimensions`, issues);
  safeBox(value.subjectSafeBox, `${path}.subjectSafeBox`, issues);
}
