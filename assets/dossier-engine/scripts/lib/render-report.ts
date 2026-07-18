import { createHash } from "node:crypto";
import type {
  AssetOrigin,
  AssetRightsStatus,
  ClaimRef,
  Dossier,
  DossierMeta,
  DossierSlide,
  EvidenceRecord,
} from "../../src/schema/types";
import type { DistributionMode } from "../../src/schema/types";
import { collectSlideAssetIds, collectThemeAssetIds } from "../../src/schema/asset-validation";

export interface PdfPageGeometry {
  readonly height: number;
  readonly unit: "pt";
  readonly width: number;
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
  readonly governance: {
    readonly distributionMode: DossierMeta["distributionMode"];
    readonly forbiddenClientTermsConfigured: number;
    readonly generativeAssets: DossierMeta["generativeAssets"];
    readonly relationshipStatus: DossierMeta["relationshipStatus"];
    readonly stage: DossierMeta["stage"];
  };
  readonly overflow: 0;
  readonly pdfPage: PdfPageGeometry;
  readonly responsivePreview: readonly [375, 1440];
  readonly sourceVersion: string;
  readonly themeAssetIds: readonly string[];
  readonly traceability: readonly RenderTraceability[];
}

function evidenceIdsForSlide(slide: DossierSlide): string[] {
  return [...new Set([
    ...(slide.evidenceIds ?? []),
    ...(slide.claims?.flatMap((claim) => claim.evidenceIds ?? []) ?? []),
  ])];
}

function usedEvidenceIds(slides: readonly DossierSlide[]): ReadonlySet<string> {
  return new Set(slides.flatMap(evidenceIdsForSlide));
}

function assetTrace(entry: Dossier["assets"][number]): RenderAssetTrace {
  const identity = entry.src ?? entry.ledgerId ?? "";
  const kind = entry.src !== undefined
    ? (entry.src.startsWith("data:") ? "data-uri" : "local-src")
    : entry.ledgerId !== undefined ? "ledger-id" : "unresolved";
  return {
    id: entry.id,
    origin: entry.origin,
    rightsBasis: entry.rightsBasis,
    status: entry.status,
    allowedDistributionScopes: entry.allowedDistributionScopes,
    sourceIdentity: {
      kind,
      sha256: createHash("sha256").update(identity).digest("hex"),
    },
  };
}

export function createRenderReport(
  dossier: Dossier,
  renderedSlides: readonly DossierSlide[],
  selection: readonly string[],
  pdfPage: PdfPageGeometry,
): RenderReport {
  const evidenceIds = usedEvidenceIds(renderedSlides);
  const themeAssetIds = collectThemeAssetIds(dossier.theme);
  const traceability = renderedSlides.map((slide): RenderTraceability => ({
    assetIds: collectSlideAssetIds(slide),
    claims: slide.claims ?? [],
    evidenceIds: evidenceIdsForSlide(slide),
    slideId: slide.id,
  }));
  const usedAssetIds = new Set([
    ...themeAssetIds,
    ...traceability.flatMap((entry) => entry.assetIds),
  ]);
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
    evidenceRegistry: dossier.evidence.filter((entry) => evidenceIds.has(entry.id)),
    assetRegistry: dossier.assets.filter((entry) => usedAssetIds.has(entry.id)).map(assetTrace),
    governance: {
      distributionMode: dossier.meta.distributionMode,
      forbiddenClientTermsConfigured: dossier.meta.forbiddenClientTerms?.length ?? 0,
      generativeAssets: dossier.meta.generativeAssets,
      relationshipStatus: dossier.meta.relationshipStatus,
      stage: dossier.meta.stage,
    },
    overflow: 0,
    pdfPage,
    responsivePreview: [375, 1440],
    sourceVersion: dossier.meta.version,
    themeAssetIds,
    traceability,
  };
}
