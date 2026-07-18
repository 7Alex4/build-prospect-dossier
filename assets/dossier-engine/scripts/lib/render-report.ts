import { createHash } from "node:crypto";
import type {
  AssetOrigin,
  AssetRightsStatus,
  ClaimRef,
  DistributionMode,
  Dossier,
  DossierMeta,
  DossierSlide,
  EvidenceRecord,
  GenerativeAssetAuthorization,
} from "../../src/schema/types";
import {
  collectSlideAssetIds,
  collectSlideAssetUsages,
  collectThemeAssetIds,
  collectThemeAssetUsages,
  type AssetUsage,
} from "../../src/schema/asset-validation";
import { assertRenderFontAudit, type RenderFontAudit } from "./render-fonts";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export interface PdfPageGeometry {
  readonly height: number;
  readonly unit: "pt";
  readonly width: number;
}

export interface RenderFileIntegrity {
  readonly file: string;
  readonly sha256: string;
}

export interface RenderPageIntegrity extends RenderFileIntegrity {
  readonly slideId: string;
}

export interface RenderSourceIntegrity extends RenderFileIntegrity {
  readonly dossierSha256: string;
}

export interface RenderIntegrity {
  readonly pages: readonly RenderPageIntegrity[];
  readonly pdf: RenderFileIntegrity;
  readonly source: RenderSourceIntegrity;
}

export interface RenderTraceability {
  readonly assetIds: readonly string[];
  readonly claims: readonly ClaimRef[];
  readonly evidenceIds: readonly string[];
  readonly slideId: string;
}

export interface RenderAssetTrace {
  readonly id: string;
  readonly origin: AssetOrigin;
  readonly rightsBasis: string;
  readonly status: AssetRightsStatus;
  readonly allowedDistributionScopes: readonly DistributionMode[];
  readonly sourceIdentity: {
    readonly kind: "data-uri" | "local-src" | "ledger-id" | "unresolved";
    readonly sha256: string;
  };
}

export interface RenderReport {
  readonly schemaVersion: "1.0";
  readonly stage: DossierMeta["stage"];
  readonly totalSlides: number;
  readonly renderedCount: number;
  readonly selectionApplied: boolean;
  readonly selection: readonly string[];
  readonly renderedSlideIds: readonly string[];
  readonly dimensions: { readonly height: 1414; readonly width: 2000 };
  readonly dossier: string;
  readonly evidenceRegistry: readonly EvidenceRecord[];
  readonly assetRegistry: readonly RenderAssetTrace[];
  readonly fontAudit: RenderFontAudit;
  readonly governance: {
    readonly distributionMode: DossierMeta["distributionMode"];
    readonly forbiddenClientTermsConfigured: number;
    readonly generativeAssets: DossierMeta["generativeAssets"];
    readonly generativeAssetsAuthorization: GenerativeAssetAuthorization | null;
    readonly relationshipStatus: DossierMeta["relationshipStatus"];
    readonly stage: DossierMeta["stage"];
  };
  readonly integrity: RenderIntegrity;
  readonly overflow: 0;
  readonly pdfPage: PdfPageGeometry;
  readonly responsivePreview: readonly [375, 1440];
  readonly sourceVersion: string;
  readonly themeAssetIds: readonly string[];
  readonly traceability: readonly RenderTraceability[];
}

function hash(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function evidenceIdsForSlide(slide: DossierSlide): string[] {
  return [...new Set([
    ...(slide.evidenceIds ?? []),
    ...(slide.claims?.flatMap((claim) => claim.evidenceIds ?? []) ?? []),
  ])];
}

function dataUriPayload(src: string): string | Uint8Array {
  const separator = src.indexOf(",");
  if (separator < 0) return src;
  const header = src.slice(0, separator);
  const payload = src.slice(separator + 1);
  if (header.endsWith(";base64")) return Buffer.from(payload, "base64");
  try {
    return decodeURIComponent(payload);
  } catch {
    return payload;
  }
}

function sourceKind(identity: string): RenderAssetTrace["sourceIdentity"]["kind"] {
  return identity.startsWith("data:") ? "data-uri" : "local-src";
}

function sourceHash(identity: string, kind: RenderAssetTrace["sourceIdentity"]["kind"]): string {
  return hash(kind === "data-uri" ? dataUriPayload(identity) : identity);
}

function assetTrace(
  entry: Dossier["assets"][number],
  usages: readonly AssetUsage[],
): RenderAssetTrace {
  const usedSources = usages.flatMap((usage) => usage.id === entry.id && usage.src !== null
    ? [usage.src]
    : []);
  const candidates = usedSources.length > 0
    ? usedSources.map((identity) => ({ identity, kind: sourceKind(identity) }))
    : entry.src !== undefined
      ? [{ identity: entry.src, kind: sourceKind(entry.src) }]
      : entry.ledgerId !== undefined
        ? [{ identity: entry.ledgerId, kind: "ledger-id" as const }]
        : [{ identity: "", kind: "unresolved" as const }];
  const identities = new Map(candidates.map((candidate) => [
    `${candidate.kind}:${sourceHash(candidate.identity, candidate.kind)}`,
    candidate,
  ]));
  if (identities.size !== 1) {
    throw new Error(`L'asset ${entry.id} utilise plusieurs contenus hydratés incompatibles.`);
  }
  const resolved = [...identities.values()][0];
  if (resolved === undefined) throw new Error(`Identité source introuvable pour ${entry.id}.`);
  return {
    id: entry.id,
    origin: entry.origin,
    rightsBasis: entry.rightsBasis,
    status: entry.status,
    allowedDistributionScopes: entry.allowedDistributionScopes,
    sourceIdentity: {
      kind: resolved.kind,
      sha256: sourceHash(resolved.identity, resolved.kind),
    },
  };
}

function assertIntegrity(
  renderedSlides: readonly DossierSlide[],
  integrity: RenderIntegrity,
): void {
  const hashes = [
    integrity.pdf.sha256,
    integrity.source.sha256,
    integrity.source.dossierSha256,
    ...integrity.pages.map((page) => page.sha256),
  ];
  if (hashes.some((value) => !SHA256_PATTERN.test(value))) {
    throw new Error("Empreinte SHA-256 de rendu invalide.");
  }
  if (integrity.pages.length !== renderedSlides.length
    || integrity.pages.some((page, index) => page.slideId !== renderedSlides[index]?.id)) {
    throw new Error("Les empreintes PNG ne correspondent pas aux slides rendues.");
  }
  const files = [integrity.pdf.file, integrity.source.file, ...integrity.pages.map((page) => page.file)];
  if (files.some((file) => file.trim().length === 0)) throw new Error("Nom d'artefact de rendu vide.");
}

function reportEvidence(
  dossier: Dossier,
  evidenceIds: ReadonlySet<string>,
): readonly EvidenceRecord[] {
  const records = dossier.evidence.filter((entry) => evidenceIds.has(entry.id));
  const internal = records.filter((entry) => entry.status === "internal-only");
  if (internal.length > 0) {
    throw new Error(`Preuves internal-only interdites dans un rapport de rendu: ${internal.map((entry) => entry.id).join(", ")}.`);
  }
  const resolved = new Set(records.map((entry) => entry.id));
  const missing = [...evidenceIds].filter((id) => !resolved.has(id));
  if (missing.length > 0) throw new Error(`Preuves introuvables dans le rapport: ${missing.join(", ")}.`);
  return records;
}

export function createRenderReport(
  dossier: Dossier,
  renderedSlides: readonly DossierSlide[],
  selection: readonly string[],
  pdfPage: PdfPageGeometry,
  integrity: RenderIntegrity,
  fontAudit: RenderFontAudit,
): RenderReport {
  assertIntegrity(renderedSlides, integrity);
  assertRenderFontAudit(dossier.theme, fontAudit);
  const themeAssetIds = collectThemeAssetIds(dossier.theme);
  const traceability = renderedSlides.map((slide): RenderTraceability => ({
    assetIds: collectSlideAssetIds(slide),
    claims: slide.claims ?? [],
    evidenceIds: evidenceIdsForSlide(slide),
    slideId: slide.id,
  }));
  const evidenceIds = new Set(traceability.flatMap((entry) => entry.evidenceIds));
  const usedAssetIds = new Set([
    ...themeAssetIds,
    ...traceability.flatMap((entry) => entry.assetIds),
  ]);
  const assetUsages = [
    ...collectThemeAssetUsages(dossier.theme),
    ...renderedSlides.flatMap((slide) => collectSlideAssetUsages(slide)),
  ];
  return {
    schemaVersion: "1.0",
    stage: dossier.meta.stage,
    totalSlides: dossier.slides.length,
    renderedCount: renderedSlides.length,
    selectionApplied: selection.length > 0,
    selection: [...selection],
    renderedSlideIds: renderedSlides.map((slide) => slide.id),
    dimensions: { height: 1414, width: 2000 },
    dossier: dossier.meta.title,
    evidenceRegistry: reportEvidence(dossier, evidenceIds),
    assetRegistry: dossier.assets
      .filter((entry) => usedAssetIds.has(entry.id))
      .map((entry) => assetTrace(entry, assetUsages)),
    fontAudit,
    governance: {
      distributionMode: dossier.meta.distributionMode,
      forbiddenClientTermsConfigured: dossier.meta.forbiddenClientTerms?.length ?? 0,
      generativeAssets: dossier.meta.generativeAssets,
      generativeAssetsAuthorization: dossier.meta.generativeAssetsAuthorization ?? null,
      relationshipStatus: dossier.meta.relationshipStatus,
      stage: dossier.meta.stage,
    },
    integrity,
    overflow: 0,
    pdfPage,
    responsivePreview: [375, 1440],
    sourceVersion: dossier.meta.version,
    themeAssetIds,
    traceability,
  };
}
