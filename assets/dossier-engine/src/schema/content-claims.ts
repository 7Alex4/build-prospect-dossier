import type { DossierSlide } from "./types";

type UnknownRecord = Record<string, unknown>;

interface MetricTarget {
  value: string;
  label: string;
}

export type ClaimTarget = string | MetricTarget;

export interface ContentEntry {
  path: string;
  value: ClaimTarget;
}

export interface VisibleString {
  path: string;
  value: string;
}

const hiddenKeys = new Set([
  "id", "type", "tone", "variant", "kind", "evidenceIds", "assetIds", "claims",
  "motifState", "chapterMark", "src", "alt", "fit", "position", "treatment",
  "url", "sourceUrl", "timecode", "number", "severity", "index",
]);

const structuralKeys = new Set([
  "eyebrow", "tag", "footer", "client", "studio", "legal", "phase", "signal",
  "relationshipLabel",
]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function metricTarget(value: unknown): MetricTarget | undefined {
  if (!isRecord(value) || typeof value.value !== "string" || typeof value.label !== "string") return undefined;
  return { value: value.value, label: value.label };
}

function childPath(path: string, key: string): string {
  return path.length > 0 ? `${path}.${key}` : key;
}

function collectClaimable(value: unknown, path: string, parentKey?: string): ContentEntry[] {
  if (typeof value === "string") return [{ path, value }];
  if (Array.isArray(value)) {
    if (parentKey === "metrics") {
      return value.flatMap((item, index) => {
        const metric = metricTarget(item);
        if (!metric) return [];
        const metricPath = `${path}[${index}]`;
        const context = isRecord(item) && typeof item.context === "string"
          ? [{ path: `${metricPath}.context`, value: item.context }]
          : [];
        return [{ path: metricPath, value: metric }, ...context];
      });
    }
    return value.flatMap((item, index) => collectClaimable(item, `${path}[${index}]`));
  }
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    hiddenKeys.has(key) ? [] : collectClaimable(child, childPath(path, key), key),
  );
}

export function claimableContentEntries(slide: DossierSlide): ContentEntry[] {
  return collectClaimable(slide, "");
}

function finalKey(path: string): string {
  const match = path.match(/(?:^|\.)([A-Za-z][A-Za-z0-9]*)$/);
  return match?.[1] ?? "";
}

export function substantiveContentEntries(slide: DossierSlide): ContentEntry[] {
  return claimableContentEntries(slide).filter((entry) => !structuralKeys.has(finalKey(entry.path)));
}

export function visibleSlideStrings(slide: DossierSlide): VisibleString[] {
  return claimableContentEntries(slide).flatMap((entry) => {
    if (typeof entry.value === "string") return [{ path: entry.path, value: entry.value }];
    return [
      { path: `${entry.path}.value`, value: entry.value.value },
      { path: `${entry.path}.label`, value: entry.value.label },
    ];
  });
}

const auditedStructuralKeys = new Set(["alt", "timecode", "number", "index", "textFallback", "text"]);

export function structuralAuditStrings(value: unknown, path = ""): VisibleString[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => structuralAuditStrings(item, `${path}[${index}]`));
  }
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, child]) => {
    if (key === "claims") return [];
    const nextPath = childPath(path, key);
    if (auditedStructuralKeys.has(key) && typeof child === "string") return [{ path: nextPath, value: child }];
    return structuralAuditStrings(child, nextPath);
  });
}

export function clientFacingAuditStrings(slide: DossierSlide): VisibleString[] {
  return [...visibleSlideStrings(slide), ...structuralAuditStrings(slide)];
}

export function normalizeClaimText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("fr").replace(/\s+/g, " ").trim();
}

export function claimMatchesTarget(text: string, target: ClaimTarget): boolean {
  const normalized = normalizeClaimText(text);
  if (typeof target === "string") return normalized === normalizeClaimText(target);
  return normalized.includes(normalizeClaimText(target.value))
    && normalized.includes(normalizeClaimText(target.label));
}

export function resolveSlideContentPath(slide: DossierSlide, path: string): unknown {
  if (!/^[A-Za-z][A-Za-z0-9]*(?:(?:\.[A-Za-z][A-Za-z0-9]*)|(?:\[\d+\]))*$/.test(path)) return undefined;
  const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  if (keys.some((key) => ["__proto__", "prototype", "constructor"].includes(key))) return undefined;
  let current: unknown = slide;
  for (const key of keys) {
    if (Array.isArray(current)) {
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) return undefined;
      current = current[index];
    } else if (isRecord(current) && Object.hasOwn(current, key)) {
      current = current[key];
    } else return undefined;
  }
  return current;
}
