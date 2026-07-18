import type { ValidationIssue } from "./validation";
import { isValidContactEmail, isValidHttpWebsite, toSafeTelHref } from "./contact-links";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

export function validateContact(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    add(issues, "nested-shape", path, "Objet contact requis.");
    return;
  }
  ["name", "role", "email"].forEach((key) => {
    if (typeof value[key] !== "string" || value[key].trim().length === 0) {
      add(issues, "nested-text", `${path}.${key}`, "Texte non vide requis.");
    }
  });
  if (typeof value.email === "string" && value.email.trim().length > 0
    && !isValidContactEmail(value.email)) {
    add(issues, "contact-email", `${path}.email`, "Adresse email valide requise.");
  }
  if (value.website !== undefined
    && (typeof value.website !== "string" || !isValidHttpWebsite(value.website))) {
    add(issues, "contact-website", `${path}.website`, "URL HTTP ou HTTPS valide requise.");
  }
  if (value.phone !== undefined
    && (typeof value.phone !== "string" || toSafeTelHref(value.phone) === undefined)) {
    add(issues, "contact-phone", `${path}.phone`, "Numéro compatible avec un lien tel requis.");
  }
}
