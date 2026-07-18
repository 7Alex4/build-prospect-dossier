import type { ValidationIssue } from "./validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function error(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

export function validateGenerativeAuthorization(
  meta: UnknownRecord,
  issues: ValidationIssue[],
): void {
  const authorization = meta.generativeAssetsAuthorization;
  if (meta.generativeAssets === "authorized") {
    if (!isRecord(authorization)) {
      error(
        issues,
        "generative-authorization-required",
        "meta.generativeAssetsAuthorization",
        "Une autorisation explicite, son auteur et sa référence sont requis.",
      );
      return;
    }
    if (authorization.status !== "explicitly-authorized") {
      error(
        issues,
        "generative-authorization-status",
        "meta.generativeAssetsAuthorization.status",
        "Valeur requise: explicitly-authorized.",
      );
    }
    ["authorizedBy", "reference"].forEach((key) => {
      if (!nonEmpty(authorization[key])) {
        error(
          issues,
          "generative-authorization-text",
          `meta.generativeAssetsAuthorization.${key}`,
          "Texte non vide requis.",
        );
      }
    });
  } else if (authorization !== undefined) {
    error(
      issues,
      "generative-authorization-mismatch",
      "meta.generativeAssetsAuthorization",
      "Supprimez l'autorisation lorsque les assets générés sont interdits.",
    );
  }
}
