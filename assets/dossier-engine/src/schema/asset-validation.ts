import type { AssetOrigin, DistributionMode } from "./asset-types";
import type { BrandTheme, DossierSlide } from "./types";
import type { ValidationIssue } from "./validation";

type UnknownRecord = Record<string, unknown>;

const distributionModes = ["private-prospecting", "client-project", "public"] as const;
const origins = [
  "provided",
  "official-site",
  "press-kit",
  "licensed-library",
  "editorial",
  "screenshot",
  "studio-created",
  "generated",
] as const satisfies readonly AssetOrigin[];
const rightsStatuses = ["approved", "reference-only", "unknown", "rejected"] as const;
const syntheticForbiddenRoles = new Set(["evidence", "product", "portrait", "identity"]);
const syntheticForbiddenNatures = new Set([
  "product-cutout", "screenshot", "document", "archive", "portrait", "brand-mark",
]);

export interface AssetUsage {
  readonly id: string | null;
  readonly mediaNature: string | null;
  readonly mediaRole: string | null;
  readonly path: string;
  readonly scope: "theme" | "slide";
  readonly slideId?: string;
  readonly src: string | null;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function error(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

function isImageLike(value: UnknownRecord): boolean {
  return Object.hasOwn(value, "src") || Object.hasOwn(value, "alt");
}

function collectImages(
  value: unknown,
  path: string,
  scope: AssetUsage["scope"],
  slideId?: string,
): AssetUsage[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectImages(entry, `${path}[${index}]`, scope, slideId));
  }
  if (!isRecord(value)) return [];
  if (isImageLike(value)) {
    return [{
      id: nonEmpty(value.id) ? value.id : null,
      mediaNature: nonEmpty(value.mediaNature) ? value.mediaNature : null,
      mediaRole: nonEmpty(value.mediaRole) ? value.mediaRole : null,
      path,
      scope,
      ...(slideId === undefined ? {} : { slideId }),
      src: nonEmpty(value.src) ? value.src : null,
    }];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    collectImages(child, `${path}.${key}`, scope, slideId),
  );
}

function uniqueIds(usages: readonly AssetUsage[]): string[] {
  return [...new Set(usages.flatMap((usage) => usage.id === null ? [] : [usage.id]))];
}

export function collectThemeAssetUsages(theme: unknown): AssetUsage[] {
  return collectImages(theme, "theme", "theme");
}

export function collectSlideAssetUsages(slide: unknown, path = "slide"): AssetUsage[] {
  const slideId = isRecord(slide) && nonEmpty(slide.id) ? slide.id : undefined;
  return collectImages(slide, path, "slide", slideId);
}

export function collectDossierAssetUsages(value: unknown): AssetUsage[] {
  if (!isRecord(value)) return [];
  const themeUsages = collectThemeAssetUsages(value.theme);
  if (!Array.isArray(value.slides)) return themeUsages;
  return [
    ...themeUsages,
    ...value.slides.flatMap((slide, index) => collectSlideAssetUsages(slide, `slides[${index}]`)),
  ];
}

export function collectThemeAssetIds(theme: BrandTheme): string[] {
  return uniqueIds(collectThemeAssetUsages(theme));
}

export function collectSlideAssetIds(slide: DossierSlide): string[] {
  return uniqueIds(collectSlideAssetUsages(slide));
}

interface RegistryEntry {
  readonly path: string;
  readonly record: UnknownRecord;
}

function validateRegistry(value: unknown, issues: ValidationIssue[]): Map<string, RegistryEntry> {
  const registry = new Map<string, RegistryEntry>();
  if (!Array.isArray(value)) {
    error(issues, "asset-registry-required", "assets", "Registre d'assets requis, même vide.");
    return registry;
  }
  value.forEach((entry, index) => {
    const path = `assets[${index}]`;
    if (!isRecord(entry)) {
      error(issues, "asset-registry-shape", path, "Objet d'asset requis.");
      return;
    }
    ["id", "origin", "rightsBasis"].forEach((key) => {
      if (!nonEmpty(entry[key])) error(issues, "asset-registry-text", `${path}.${key}`, "Texte non vide requis.");
    });
    if (entry.src !== undefined && !nonEmpty(entry.src)) {
      error(issues, "asset-registry-text", `${path}.src`, "Source non vide requise lorsqu'elle est fournie.");
    }
    if (entry.ledgerId !== undefined && !nonEmpty(entry.ledgerId)) {
      error(issues, "asset-registry-text", `${path}.ledgerId`, "Identifiant de registre non vide requis.");
    }
    if (!nonEmpty(entry.src) && !nonEmpty(entry.ledgerId)) {
      error(issues, "asset-registry-identity", path, "Une source locale ou un ledgerId est requis.");
    }
    if (!origins.includes(entry.origin as AssetOrigin)) {
      error(issues, "asset-origin", `${path}.origin`, `Origine attendue: ${origins.join(", ")}.`);
    }
    if (typeof entry.status !== "string" || !rightsStatuses.includes(entry.status as typeof rightsStatuses[number])) {
      error(issues, "asset-rights-status-enum", `${path}.status`, `Statut attendu: ${rightsStatuses.join(", ")}.`);
    }
    if (!Array.isArray(entry.allowedDistributionScopes)) {
      error(issues, "asset-scopes-shape", `${path}.allowedDistributionScopes`, "Liste de scopes requise.");
    } else {
      const seen = new Set<string>();
      entry.allowedDistributionScopes.forEach((scope, scopeIndex) => {
        const scopePath = `${path}.allowedDistributionScopes[${scopeIndex}]`;
        if (typeof scope !== "string" || !distributionModes.includes(scope as DistributionMode)) {
          error(issues, "asset-scope-enum", scopePath, `Scope attendu: ${distributionModes.join(", ")}.`);
        } else if (seen.has(scope)) {
          error(issues, "asset-scope-duplicate", scopePath, "Scope dupliqué.");
        } else seen.add(scope);
      });
    }
    if (nonEmpty(entry.id)) {
      if (registry.has(entry.id)) {
        error(issues, "asset-registry-duplicate", `${path}.id`, "Identifiant d'asset dupliqué.");
      } else registry.set(entry.id, { path, record: entry });
    }
  });
  return registry;
}

function validateUsage(
  usage: AssetUsage,
  registry: ReadonlyMap<string, RegistryEntry>,
  distributionMode: unknown,
  generativeAssets: unknown,
  issues: ValidationIssue[],
): void {
  if (usage.id === null) {
    error(issues, "asset-id-required", `${usage.path}.id`, "Identifiant d'asset non vide requis.");
    return;
  }
  if (usage.src !== null && /^https?:\/\//i.test(usage.src)) {
    error(issues, "remote-asset", `${usage.path}.src`, "Source distante interdite pour un rendu déterministe.");
  }
  const registryEntry = registry.get(usage.id);
  if (!registryEntry) {
    error(issues, "asset-unregistered", `${usage.path}.id`, `Asset absent du registre: ${usage.id}.`);
    return;
  }
  const record = registryEntry.record;
  if (record.status !== "approved") {
    error(issues, "asset-rights-status", `${registryEntry.path}.status`, `L'asset utilisé ${usage.id} doit être approved.`);
  }
  if (nonEmpty(distributionMode)
    && Array.isArray(record.allowedDistributionScopes)
    && !record.allowedDistributionScopes.includes(distributionMode)) {
    error(
      issues,
      "asset-distribution-scope",
      `${registryEntry.path}.allowedDistributionScopes`,
      `L'asset ${usage.id} n'est pas autorisé pour ${distributionMode}.`,
    );
  }
  if (record.origin === "generated" && generativeAssets !== "authorized") {
    error(issues, "asset-generative-policy", `${registryEntry.path}.origin`, "Asset généré interdit par meta.generativeAssets.");
  }
  if (record.origin === "generated"
    && (syntheticForbiddenRoles.has(usage.mediaRole ?? "")
      || syntheticForbiddenNatures.has(usage.mediaNature ?? ""))) {
    error(
      issues,
      "asset-synthetic-misrepresentation",
      usage.path,
      "Un média généré ne peut pas représenter une preuve, un produit exact, une personne, un document, une archive ou une identité.",
    );
  }
  if (nonEmpty(record.src) && usage.src !== null && record.src !== usage.src) {
    error(issues, "asset-src-mismatch", `${usage.path}.src`, `La source ne correspond pas au registre pour ${usage.id}.`);
  }
}

export function validateAssetGovernance(value: UnknownRecord, issues: ValidationIssue[]): void {
  const registry = validateRegistry(value.assets, issues);
  const meta = isRecord(value.meta) ? value.meta : {};
  collectDossierAssetUsages(value).forEach((usage) =>
    validateUsage(usage, registry, meta.distributionMode, meta.generativeAssets, issues),
  );
  if (!Array.isArray(value.slides)) return;
  value.slides.forEach((slide, index) => {
    if (isRecord(slide) && Object.hasOwn(slide, "assetIds")) {
      error(
        issues,
        "asset-ids-derived",
        `slides[${index}].assetIds`,
        "Supprimez assetIds: le moteur dérive les identifiants des ImageAsset réellement traversés.",
      );
    }
  });
}
