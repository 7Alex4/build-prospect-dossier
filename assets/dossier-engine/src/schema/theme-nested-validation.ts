import type { ValidationIssue } from "./validation";
import { validateImageShape as image } from "./image-shape-validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

function allowed(value: unknown, values: readonly string[], path: string, issues: ValidationIssue[]): void {
  if (typeof value !== "string" || !values.includes(value)) add(issues, "enum", path, `Valeur attendue: ${values.join(", ")}.`);
}

function strings(record: UnknownRecord, keys: readonly string[], path: string, issues: ValidationIssue[]): void {
  keys.forEach((key) => {
    if (typeof record[key] !== "string" || (record[key] as string).trim().length === 0) {
      add(issues, "nested-text", `${path}.${key}`, "Texte non vide requis.");
    }
  });
}

function colors(record: UnknownRecord, keys: readonly string[], path: string, issues: ValidationIssue[]): void {
  keys.forEach((key) => {
    if (typeof record[key] !== "string" || !/^#[0-9a-f]{6}$/i.test(record[key] as string)) {
      add(issues, "theme-color", `${path}.${key}`, "Couleur hexadécimale #RRGGBB requise.");
    }
  });
}

function numberInRange(value: unknown, path: string, issues: ValidationIssue[], minimum: number, maximum: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    add(issues, "theme-number", path, `Nombre entre ${minimum} et ${maximum} requis.`);
  }
}

function requiredImage(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (value === undefined) add(issues, "image-required", path, "Image requise.");
  else image(value, path, issues);
}

function validateMotif(value: UnknownRecord, issues: ValidationIssue[]): void {
  if (!isRecord(value.motif)) {
    add(issues, "theme-shape", "theme.motif", "Objet motif requis.");
    return;
  }
  const motif = value.motif;
  allowed(motif.kind, ["frame", "orbit", "grid", "signal", "asset", "none"], "theme.motif.kind", issues);
  if (motif.derivation !== undefined) allowed(motif.derivation, ["prospect-derived", "typographic-system", "generic"], "theme.motif.derivation", issues);
  allowed(motif.density, ["quiet", "balanced", "bold"], "theme.motif.density", issues);
  numberInRange(motif.strokeWidth, "theme.motif.strokeWidth", issues, 0, 12);
  numberInRange(motif.cornerRadius, "theme.motif.cornerRadius", issues, 0, 240);
  if (typeof motif.showIndex !== "boolean") add(issues, "theme-boolean", "theme.motif.showIndex", "Booléen requis.");
  if (motif.kind === "asset") {
    if (isRecord(motif.assets)) {
      requiredImage(motif.assets.full, "theme.motif.assets.full", issues);
      image(motif.assets.quiet, "theme.motif.assets.quiet", issues);
    } else add(issues, "theme-shape", "theme.motif.assets", "Asset full requis, asset quiet optionnel.");
  }
  if (motif.placement === undefined) return;
  if (!isRecord(motif.placement)) {
    add(issues, "theme-shape", "theme.motif.placement", "Placement objet requis.");
    return;
  }
  numberInRange(motif.placement.x, "theme.motif.placement.x", issues, -2000, 4000);
  numberInRange(motif.placement.y, "theme.motif.placement.y", issues, -1414, 2828);
  numberInRange(motif.placement.width, "theme.motif.placement.width", issues, 1, 4000);
  numberInRange(motif.placement.height, "theme.motif.placement.height", issues, 1, 2828);
}

function validateLogoAndBackgrounds(value: UnknownRecord, issues: ValidationIssue[]): void {
  if (isRecord(value.logo)) {
    strings(value.logo, ["textFallback"], "theme.logo", issues);
    image(value.logo.mark, "theme.logo.mark", issues);
    image(value.logo.wordmark, "theme.logo.wordmark", issues);
  } else add(issues, "theme-shape", "theme.logo", "Objet logo requis.");
  if (value.backgrounds === undefined) return;
  if (!isRecord(value.backgrounds)) {
    add(issues, "theme-shape", "theme.backgrounds", "Objet de fonds requis.");
    return;
  }
  const backgrounds = value.backgrounds;
  ["paper", "ink", "accent", "surface", "signal"].forEach((tone) =>
    image(backgrounds[tone], `theme.backgrounds.${tone}`, issues),
  );
}

function validateChrome(value: UnknownRecord, issues: ValidationIssue[]): void {
  if (value.pageMarker !== undefined) {
    if (!isRecord(value.pageMarker)) add(issues, "theme-shape", "theme.pageMarker", "Objet marqueur requis.");
    else {
      allowed(value.pageMarker.kind, ["number", "rotating-asset", "none"], "theme.pageMarker.kind", issues);
      if (value.pageMarker.kind === "rotating-asset") requiredImage(value.pageMarker.asset, "theme.pageMarker.asset", issues);
      if (value.pageMarker.startAngle !== undefined) numberInRange(value.pageMarker.startAngle, "theme.pageMarker.startAngle", issues, -3600, 3600);
      if (value.pageMarker.stepAngle !== undefined) numberInRange(value.pageMarker.stepAngle, "theme.pageMarker.stepAngle", issues, -360, 360);
    }
  }
  if (value.chrome === undefined) return;
  if (!isRecord(value.chrome)) {
    add(issues, "theme-shape", "theme.chrome", "Objet chrome requis.");
    return;
  }
  allowed(value.chrome.footer, ["bordered", "minimal", "hidden"], "theme.chrome.footer", issues);
  if (value.chrome.runningHeader === undefined) return;
  if (!isRecord(value.chrome.runningHeader)) {
    add(issues, "theme-shape", "theme.chrome.runningHeader", "Objet en-tête requis.");
    return;
  }
  strings(value.chrome.runningHeader, ["text"], "theme.chrome.runningHeader", issues);
  allowed(value.chrome.runningHeader.align, ["left", "center", "right"], "theme.chrome.runningHeader.align", issues);
  if (typeof value.chrome.runningHeader.showOnCover !== "boolean") {
    add(issues, "theme-boolean", "theme.chrome.runningHeader.showOnCover", "Booléen requis.");
  }
}

export function validateThemeShape(value: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(value)) return;
  if (isRecord(value.palette)) colors(value.palette, ["ink", "paper", "accent", "muted", "surface", "signal"], "theme.palette", issues);
  else add(issues, "theme-shape", "theme.palette", "Objet palette requis.");
  if (isRecord(value.typography)) strings(value.typography, ["display", "body", "mono"], "theme.typography", issues);
  else add(issues, "theme-shape", "theme.typography", "Objet typographie requis.");
  validateMotif(value, issues);
  validateLogoAndBackgrounds(value, issues);
  validateChrome(value, issues);
}
