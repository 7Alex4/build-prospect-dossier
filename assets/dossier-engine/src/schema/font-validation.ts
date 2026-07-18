import type { ValidationIssue } from "./validation";

type UnknownRecord = Record<string, unknown>;

const roles = ["display", "body", "mono"] as const;
const styles = ["normal", "italic"] as const;
const weights = [400, 500, 600, 700, 800, 900] as const;
const formats = ["woff2", "woff", "otf", "ttf"] as const;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function add(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

function primaryFamily(value: unknown): string | null {
  if (!nonEmpty(value)) return null;
  return value.split(",")[0]?.trim().replace(/^(?:'|")|(?:'|")$/g, "") ?? null;
}

function safeRelativeFontFile(value: string): boolean {
  const normalized = value.replace(/\\/g, "/");
  return !normalized.startsWith("/")
    && !/^[a-z]:/i.test(normalized)
    && !/^https?:/i.test(normalized)
    && normalized.split("/").every((part) => part.length > 0 && part !== ".." && part !== ".");
}

function stringList(value: unknown, path: string, issues: ValidationIssue[]): readonly string[] {
  if (!Array.isArray(value) || value.length === 0) {
    add(issues, "font-list", path, "Liste non vide requise.");
    return [];
  }
  const valid: string[] = [];
  value.forEach((entry, index) => {
    if (!nonEmpty(entry)) add(issues, "font-list", `${path}[${index}]`, "Texte non vide requis.");
    else valid.push(entry);
  });
  return valid;
}

function validateSource(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isRecord(value)) {
    add(issues, "font-source", path, "Source de fonte requise.");
    return;
  }
  if (!nonEmpty(value.license)) add(issues, "font-license", `${path}.license`, "Base de licence non vide requise.");
  if (value.kind === "system") {
    stringList(value.allowedResolvedFamilies, `${path}.allowedResolvedFamilies`, issues);
    return;
  }
  if (value.kind !== "local") {
    add(issues, "font-source-kind", `${path}.kind`, "Valeur attendue: system ou local.");
    return;
  }
  if (!nonEmpty(value.file) || !safeRelativeFontFile(value.file)) {
    add(issues, "font-file", `${path}.file`, "Chemin de fonte local, relatif et sans remontée requis.");
  }
  if (!formats.includes(value.format as typeof formats[number])) {
    add(issues, "font-format", `${path}.format`, `Format attendu: ${formats.join(", ")}.`);
  }
  if (!nonEmpty(value.sha256) || !SHA256_PATTERN.test(value.sha256)) {
    add(issues, "font-hash", `${path}.sha256`, "Empreinte SHA-256 minuscule requise.");
  }
}

export function validateFontContract(value: UnknownRecord, issues: ValidationIssue[]): void {
  const meta = isRecord(value.meta) ? value.meta : {};
  const theme = isRecord(value.theme) ? value.theme : {};
  const typography = isRecord(theme.typography) ? theme.typography : {};
  const faces = typography.faces;
  if (faces === undefined) {
    if (meta.stage === "final") add(issues, "font-contract-required", "theme.typography.faces", "Contrat de fontes requis au stage final.");
    return;
  }
  if (!Array.isArray(faces) || faces.length === 0) {
    add(issues, "font-contract-shape", "theme.typography.faces", "Liste de fontes non vide requise.");
    return;
  }
  const covered = new Map<string, Set<number>>();
  faces.forEach((entry, index) => {
    const path = `theme.typography.faces[${index}]`;
    if (!isRecord(entry)) {
      add(issues, "font-face-shape", path, "Objet de fonte requis.");
      return;
    }
    if (!roles.includes(entry.role as typeof roles[number])) add(issues, "font-role", `${path}.role`, `Rôle attendu: ${roles.join(", ")}.`);
    if (!nonEmpty(entry.family)) add(issues, "font-family", `${path}.family`, "Famille non vide requise.");
    if (!styles.includes(entry.style as typeof styles[number])) add(issues, "font-style", `${path}.style`, `Style attendu: ${styles.join(", ")}.`);
    const declaredWeights = Array.isArray(entry.weights) ? entry.weights : [];
    if (declaredWeights.length === 0) add(issues, "font-weights", `${path}.weights`, "Au moins une graisse est requise.");
    const coverageKey = `${String(entry.role)}:${String(entry.style)}`;
    const roleWeights = covered.get(coverageKey) ?? new Set<number>();
    declaredWeights.forEach((weight, weightIndex) => {
      if (!weights.includes(weight as typeof weights[number])) add(issues, "font-weight", `${path}.weights[${weightIndex}]`, `Graisse attendue: ${weights.join(", ")}.`);
      else if (roleWeights.has(Number(weight))) add(issues, "font-weight-duplicate", `${path}.weights[${weightIndex}]`, "Graisse déjà déclarée pour ce rôle.");
      else roleWeights.add(Number(weight));
    });
    covered.set(coverageKey, roleWeights);
    const roleFamily = roles.includes(entry.role as typeof roles[number]) ? primaryFamily(typography[String(entry.role)]) : null;
    if (roleFamily !== null && entry.family !== roleFamily) {
      add(issues, "font-family-mismatch", `${path}.family`, `La famille doit correspondre au premier choix CSS: ${roleFamily}.`);
    }
    validateSource(entry.source, `${path}.source`, issues);
  });
  if (meta.stage !== "final") return;
  roles.forEach((role) => {
    [400, 700].forEach((weight) => {
      if (!covered.get(`${role}:normal`)?.has(weight)) add(issues, "font-weight-required", "theme.typography.faces", `${role} normal doit déclarer la graisse ${weight}.`);
    });
  });
}
