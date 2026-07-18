import {
  validateRenderAssets,
} from "./render-report-asset-validation.js";
import { validateRenderFonts } from "./render-report-font-validation.js";
import { validateRenderGovernance } from "./render-report-governance-validation.js";

type UnknownRecord = Record<string, unknown>;

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export interface ExpectedRenderPage {
  readonly file: string;
  readonly sha256: string;
}

export interface DeclaredFileIntegrity {
  readonly file: string;
  readonly sha256: string;
}

export interface DeclaredSourceIntegrity extends DeclaredFileIntegrity {
  readonly dossierSha256: string;
}

export interface RenderReportStructure {
  readonly schemaVersion: string | null;
  readonly stage: string | null;
  readonly totalSlides: number | null;
  readonly renderedCount: number | null;
  readonly selectionApplied: boolean | null;
  readonly selection: readonly string[] | null;
  readonly renderedSlideIds: readonly string[] | null;
  readonly pdf: DeclaredFileIntegrity | null;
  readonly source: DeclaredSourceIntegrity | null;
}

export interface RenderReportStructureInspection {
  readonly structure: RenderReportStructure;
  readonly issues: readonly string[];
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): readonly string[] | null {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string") ? value : null;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validHash(value: unknown): value is string {
  return typeof value === "string" && SHA256_PATTERN.test(value);
}

function safeName(value: string): string {
  const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64);
}

function expectedFile(slideId: string, index: number): string {
  return `${String(index + 1).padStart(2, "0")}-${safeName(slideId)}.png`;
}

function fileIntegrity(value: unknown, label: string, issues: string[]): DeclaredFileIntegrity | null {
  if (!isRecord(value) || !nonEmpty(value.file) || !validHash(value.sha256)) {
    issues.push(`${label} must contain a non-empty file and a SHA-256 hash.`);
    return null;
  }
  return { file: value.file, sha256: value.sha256 };
}

function validateEvidence(value: unknown, issues: string[]): Set<string> {
  if (!Array.isArray(value)) {
    issues.push("Render report evidenceRegistry must be an array.");
    return new Set();
  }
  const ids = new Set<string>();
  value.forEach((entry, index) => {
    if (!isRecord(entry) || !nonEmpty(entry.id) || !nonEmpty(entry.kind)
      || !nonEmpty(entry.status) || !nonEmpty(entry.claim)) {
      issues.push(`Render report evidenceRegistry[${index}] is incomplete.`);
      return;
    }
    if (ids.has(entry.id)) issues.push(`Render report contains duplicate evidence ID: ${entry.id}.`);
    ids.add(entry.id);
    if (entry.status === "internal-only") {
      issues.push(`Render report exposes internal-only evidence: ${entry.id}.`);
    }
  });
  return ids;
}

function referencedClaimEvidence(claims: readonly unknown[], issues: string[], index: number): string[] {
  return claims.flatMap((claim, claimIndex) => {
    if (!isRecord(claim) || !nonEmpty(claim.text) || !nonEmpty(claim.kind) || !nonEmpty(claim.contentPath)) {
      issues.push(`Render report traceability[${index}].claims[${claimIndex}] is incomplete.`);
      return [];
    }
    const ids = claim.evidenceIds === undefined ? [] : stringArray(claim.evidenceIds);
    if (ids === null) {
      issues.push(`Render report traceability[${index}].claims[${claimIndex}].evidenceIds is invalid.`);
      return [];
    }
    return [...ids];
  });
}

function validateTraceability(
  value: unknown,
  renderedSlideIds: readonly string[] | null,
  assetIds: ReadonlySet<string>,
  evidenceIds: ReadonlySet<string>,
  themeAssetIds: readonly string[] | null,
  issues: string[],
): void {
  if (!Array.isArray(value)) {
    issues.push("Render report traceability must be an array.");
    return;
  }
  if (renderedSlideIds === null || value.length !== renderedSlideIds.length) {
    issues.push("Render report traceability must cover every rendered slide.");
  }
  const usedAssets = new Set(themeAssetIds ?? []);
  const usedEvidence = new Set<string>();
  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      issues.push(`Render report traceability[${index}] is invalid.`);
      return;
    }
    const assets = stringArray(entry.assetIds);
    const evidence = stringArray(entry.evidenceIds);
    const claims = Array.isArray(entry.claims) ? entry.claims : null;
    if (entry.slideId !== renderedSlideIds?.[index] || assets === null || evidence === null || claims === null) {
      issues.push(`Render report traceability[${index}] is incomplete or out of order.`);
      return;
    }
    assets.forEach((id) => usedAssets.add(id));
    evidence.forEach((id) => usedEvidence.add(id));
    referencedClaimEvidence(claims, issues, index).forEach((id) => usedEvidence.add(id));
  });
  [...usedAssets].filter((id) => !assetIds.has(id))
    .forEach((id) => issues.push(`Render report references unknown asset: ${id}.`));
  [...assetIds].filter((id) => !usedAssets.has(id))
    .forEach((id) => issues.push(`Render report contains unreferenced asset: ${id}.`));
  [...usedEvidence].filter((id) => !evidenceIds.has(id))
    .forEach((id) => issues.push(`Render report references unknown evidence: ${id}.`));
  [...evidenceIds].filter((id) => !usedEvidence.has(id))
    .forEach((id) => issues.push(`Render report contains unreferenced evidence: ${id}.`));
}

function validateIntegrity(
  value: unknown,
  pages: readonly ExpectedRenderPage[],
  slideIds: readonly string[] | null,
  issues: string[],
): { readonly pdf: DeclaredFileIntegrity | null; readonly source: DeclaredSourceIntegrity | null } {
  if (!isRecord(value)) {
    issues.push("Render report integrity block is missing or invalid.");
    return { pdf: null, source: null };
  }
  const pdf = fileIntegrity(value.pdf, "Render report PDF integrity", issues);
  const sourceFile = fileIntegrity(value.source, "Render report source integrity", issues);
  const source = sourceFile !== null && isRecord(value.source) && validHash(value.source.dossierSha256)
    ? { ...sourceFile, dossierSha256: value.source.dossierSha256 }
    : null;
  if (sourceFile !== null && source === null) {
    issues.push("Render report source integrity must contain dossierSha256.");
  }
  if (!Array.isArray(value.pages) || value.pages.length !== pages.length) {
    issues.push("Render report PNG integrity must cover every page.");
  } else {
    value.pages.forEach((entry, index) => {
      const expected = pages[index];
      if (!isRecord(entry) || expected === undefined || entry.file !== expected.file
        || entry.sha256 !== expected.sha256 || entry.slideId !== slideIds?.[index]) {
        issues.push(`Render report PNG integrity mismatch at page ${index + 1}.`);
      }
    });
  }
  return { pdf, source };
}

export function inspectRenderReportStructure(
  parsed: unknown,
  orderedPages: readonly ExpectedRenderPage[],
): RenderReportStructureInspection {
  const value = isRecord(parsed) ? parsed : {};
  const schemaVersion = typeof value.schemaVersion === "string" ? value.schemaVersion : null;
  const stage = typeof value.stage === "string" ? value.stage : null;
  const totalSlides = Number.isInteger(value.totalSlides) ? value.totalSlides as number : null;
  const renderedCount = Number.isInteger(value.renderedCount) ? value.renderedCount as number : null;
  const selectionApplied = typeof value.selectionApplied === "boolean" ? value.selectionApplied : null;
  const selection = stringArray(value.selection);
  const renderedSlideIds = stringArray(value.renderedSlideIds);
  const issues: string[] = [];
  if (schemaVersion !== "1.0") issues.push("Render report schemaVersion must be 1.0.");
  if (stage !== "final") issues.push("Render report stage must be final for delivery.");
  if (selectionApplied !== false || selection === null || selection.length !== 0) {
    issues.push("Render report must describe a full render with no slide selection.");
  }
  if (totalSlides === null || renderedCount === null || renderedSlideIds === null) {
    issues.push("Render report is missing totalSlides, renderedCount or renderedSlideIds.");
  } else {
    if (totalSlides !== orderedPages.length || renderedCount !== totalSlides || renderedSlideIds.length !== totalSlides) {
      issues.push("Render report slide counts must match the complete PNG sequence.");
    }
    if (new Set(renderedSlideIds).size !== renderedSlideIds.length) {
      issues.push("Render report contains duplicate slide IDs.");
    }
    if (renderedSlideIds.some((id, index) => expectedFile(id, index) !== orderedPages[index]?.file)) {
      issues.push("Render report slide IDs and order do not match the PNG filenames.");
    }
  }
  if (!nonEmpty(value.dossier) || !nonEmpty(value.sourceVersion)) {
    issues.push("Render report dossier and sourceVersion are required.");
  }
  if (!isRecord(value.dimensions) || value.dimensions.width !== 2000 || value.dimensions.height !== 1414) {
    issues.push("Render report dimensions must be 2000×1414.");
  }
  if (value.overflow !== 0) issues.push("Render report overflow must be zero.");
  if (!isRecord(value.pdfPage) || value.pdfPage.unit !== "pt"
    || typeof value.pdfPage.width !== "number" || typeof value.pdfPage.height !== "number") {
    issues.push("Render report pdfPage is missing or invalid.");
  }
  if (!Array.isArray(value.responsivePreview)
    || value.responsivePreview[0] !== 375 || value.responsivePreview[1] !== 1440
    || value.responsivePreview.length !== 2) {
    issues.push("Render report responsivePreview must be [375, 1440].");
  }
  const assetPolicy = validateRenderGovernance(value.governance, stage, issues);
  const evidenceIds = validateEvidence(value.evidenceRegistry, issues);
  const assetIds = validateRenderAssets(value.assetRegistry, assetPolicy, issues);
  validateRenderFonts(value.fontAudit, issues);
  const themeAssetIds = stringArray(value.themeAssetIds);
  if (themeAssetIds === null) issues.push("Render report themeAssetIds must be an array.");
  validateTraceability(value.traceability, renderedSlideIds, assetIds, evidenceIds, themeAssetIds, issues);
  const integrity = validateIntegrity(value.integrity, orderedPages, renderedSlideIds, issues);
  return {
    structure: {
      schemaVersion,
      stage,
      totalSlides,
      renderedCount,
      selectionApplied,
      selection,
      renderedSlideIds,
      pdf: integrity.pdf,
      source: integrity.source,
    },
    issues,
  };
}
