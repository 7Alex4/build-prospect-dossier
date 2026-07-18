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
}
