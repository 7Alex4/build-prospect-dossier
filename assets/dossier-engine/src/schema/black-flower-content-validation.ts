import type { ValidationIssue } from "./validation";

type UnknownRecord = Record<string, unknown>;

interface NarrativeBeat {
  readonly index: number;
  readonly label: string;
}

const groundedKinds = new Set(["fact", "quote", "observation", "interpretation"]);
const objectiveKinds = new Set(["fact", "quote", "observation"]);
const groundedSections = new Set(["architecture", "proof", "risk", "opportunity"]);
const diagnosticOrigins = new Set(["provided", "official-site", "press-kit", "editorial", "screenshot"]);
const diagnosticNatures = new Set(["photograph", "product-cutout", "screenshot", "document", "archive", "portrait"]);
export const blackFlowerCompositionBindings = {
  "silent-cover": ["cover"],
  "editorial-split": ["proof", "risk", "opportunity", "film-concept"],
  "editorial-columns": ["three-columns"],
  "image-dominant": ["proof", "risk", "opportunity", "activation", "film-concept"],
  "object-overlap": ["film-concept"],
  "evidence-field": ["proof"],
  "typographic-manifesto": ["manifesto"],
  "editorial-sequence": ["timeline"],
  "storyboard-grid": ["storyboard"],
  "reference-wall": ["references"],
  "portrait-profile": ["production"],
  "diagrammatic-system": ["architecture", "platform", "timeline"],
  "closing-letter": ["thank-you"],
  lockup: ["lockup"],
} as const;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

function firstIndex(slides: readonly unknown[], predicate: (slide: UnknownRecord) => boolean): number {
  return slides.findIndex((slide) => isRecord(slide) && predicate(slide));
}

function countType(slides: readonly unknown[], type: string): number {
  return slides.filter((slide) => isRecord(slide) && slide.type === type).length;
}

function exactType(slides: readonly unknown[], type: string, issues: ValidationIssue[]): void {
  const count = countType(slides, type);
  if (count !== 1) add(issues, "black-flower-narrative-type", "slides", `Une seule page ${type} est requise, trouvé: ${count}.`);
}

function validateDiagnosticMedia(
  slides: readonly unknown[],
  assets: unknown,
  issues: ValidationIssue[],
): void {
  const origins = new Map<string, string>();
  if (Array.isArray(assets)) assets.forEach((asset) => {
    if (isRecord(asset) && typeof asset.id === "string" && typeof asset.origin === "string") {
      origins.set(asset.id, asset.origin);
    }
  });
  const requirements: ReadonlyArray<readonly [string, string, string]> = [
    ["architecture", "black-flower-brand-truth", "La vérité de marque exige une page architecture avec un média documentaire."],
    ["proof", "black-flower-current-baseline", "L'état actuel exige une page de preuve avec un média documentaire."],
  ];
  requirements.forEach(([type, code, message]) => {
    const index = firstIndex(slides, (slide) => slide.type === type);
    const entry = slides[index];
    if (index >= 0 && (!isRecord(entry) || !isRecord(entry.image))) {
      add(issues, code, `slides[${index}].image`, message);
    } else if (isRecord(entry) && isRecord(entry.image)) {
      const image = entry.image;
      const origin = typeof image.id === "string" ? origins.get(image.id) : undefined;
      if (image.mediaRole !== "evidence"
        || !diagnosticNatures.has(String(image.mediaNature))
        || !diagnosticOrigins.has(origin ?? "")) {
        add(
          issues,
          "black-flower-diagnostic-media",
          `slides[${index}].image`,
          "La vérité de marque et l'état actuel exigent une preuve réelle ou documentaire enregistrée, jamais une projection générée.",
        );
      }
    }
  });
}

function validateRouteCount(
  meta: UnknownRecord,
  slides: readonly unknown[],
  issues: ValidationIssue[],
): void {
  const actual = countType(slides, "film-concept");
  if (meta.campaignMode !== "focused-opportunity" && meta.campaignMode !== "campaign-platform") {
    add(issues, "black-flower-campaign-mode", "meta.campaignMode", "Valeur requise: focused-opportunity ou campaign-platform.");
  }
  if (!Number.isInteger(meta.creativeRouteCount) || Number(meta.creativeRouteCount) < 0) {
    add(issues, "black-flower-route-count", "meta.creativeRouteCount", "Annoncez le nombre de routes film, zéro compris.");
  } else if (meta.creativeRouteCount !== actual) {
    add(issues, "black-flower-route-count", "meta.creativeRouteCount", `Routes annoncées: ${String(meta.creativeRouteCount)}. Pages film-concept: ${actual}.`);
  }
  if (meta.campaignMode === "campaign-platform" && actual < 2) {
    add(issues, "black-flower-route-depth", "slides", `Une plateforme de campagne exige deux routes créatives minimum, trouvé: ${actual}.`);
  }
}

function validateNarrative(
  meta: UnknownRecord,
  slides: readonly unknown[],
  assets: unknown,
  issues: ValidationIssue[],
): void {
  if (slides.length < 15 || slides.length > 20) {
    add(issues, "black-flower-slide-count", "slides", `Un dossier Black Flower final contient 15 à 20 pages, trouvé: ${slides.length}.`);
  }
  ["cover", "production", "thank-you", "lockup"].forEach((type) => exactType(slides, type, issues));
  if (!isRecord(slides[0]) || slides[0].type !== "cover") {
    add(issues, "black-flower-opening", "slides[0]", "La couverture doit être la première page.");
  }
  const finalIndex = slides.length - 1;
  if (!isRecord(slides[finalIndex]) || slides[finalIndex].type !== "lockup") {
    add(issues, "black-flower-closing", `slides[${finalIndex}]`, "Le lockup doit être la dernière page.");
  }

  const platform = firstIndex(slides, (slide) => slide.type === "platform") >= 0
    ? firstIndex(slides, (slide) => slide.type === "platform")
    : firstIndex(slides, (slide) => slide.type === "manifesto");
  const route = firstIndex(slides, (slide) => slide.type === "film-concept") >= 0
    ? firstIndex(slides, (slide) => slide.type === "film-concept")
    : firstIndex(slides, (slide) => slide.type === "activation");
  const execution = firstIndex(slides, (slide) => slide.type === "storyboard") >= 0
    ? firstIndex(slides, (slide) => slide.type === "storyboard")
    : firstIndex(slides, (slide) => slide.type === "timeline" && slide.compositionFamily === "editorial-sequence");
  const beats: readonly NarrativeBeat[] = [
    { label: "vérité de marque et architecture", index: firstIndex(slides, (slide) => slide.type === "architecture") },
    { label: "état actuel et preuve", index: firstIndex(slides, (slide) => slide.type === "proof") },
    { label: "risque", index: firstIndex(slides, (slide) => slide.type === "risk") },
    { label: "opportunité", index: firstIndex(slides, (slide) => slide.type === "opportunity") },
    { label: "plateforme", index: platform },
    { label: "route créative", index: route },
    { label: "exécution visuelle", index: execution },
    { label: "production Black Flower", index: firstIndex(slides, (slide) => slide.type === "production") },
    { label: "merci", index: firstIndex(slides, (slide) => slide.type === "thank-you") },
  ];
  beats.forEach((beat) => {
    if (beat.index < 0) add(issues, "black-flower-narrative-required", "slides", `Étape narrative requise: ${beat.label}.`);
  });
  const present = beats.filter((beat) => beat.index >= 0);
  present.slice(1).forEach((beat, index) => {
    const previous = present[index];
    if (previous && beat.index <= previous.index) {
      add(issues, "black-flower-narrative-order", `slides[${beat.index}]`, `${beat.label} doit suivre ${previous.label}.`);
    }
  });
  validateDiagnosticMedia(slides, assets, issues);
  validateRouteCount(meta, slides, issues);
}

function hasEvidence(claim: UnknownRecord): boolean {
  return Array.isArray(claim.evidenceIds) && claim.evidenceIds.some((id) => typeof id === "string" && id.trim().length > 0);
}

function isNarrativeGrounding(claim: UnknownRecord): boolean {
  return groundedKinds.has(String(claim.kind))
    && hasEvidence(claim)
    && typeof claim.contentPath === "string"
    && !claim.contentPath.endsWith(".credit");
}

function validateClaimIntegrity(slides: readonly unknown[], issues: ValidationIssue[]): void {
  const claims: UnknownRecord[] = [];
  const evidenceIds = new Set<string>();
  slides.forEach((slide, slideIndex) => {
    if (!isRecord(slide) || !Array.isArray(slide.claims)) return;
    const slideClaims = slide.claims.filter(isRecord);
    claims.push(...slideClaims);
    slideClaims.forEach((claim, claimIndex) => {
      if (claim.kind === "interpretation" && !hasEvidence(claim)) {
        add(issues, "black-flower-interpretation-source", `slides[${slideIndex}].claims[${claimIndex}].evidenceIds`, "Une interprétation Black Flower exige une preuve de départ.");
      }
      if (isNarrativeGrounding(claim) && Array.isArray(claim.evidenceIds)) {
        claim.evidenceIds.forEach((id) => { if (typeof id === "string") evidenceIds.add(id); });
      }
    });
    if (groundedSections.has(String(slide.type)) && !slideClaims.some(isNarrativeGrounding)) {
      add(issues, "black-flower-grounded-section", `slides[${slideIndex}].claims`, `La page ${String(slide.type)} exige au moins un claim sourcé non classé proposal.`);
    }
  });
  const grounded = claims.filter(isNarrativeGrounding);
  const objective = grounded.filter((claim) => objectiveKinds.has(String(claim.kind)));
  const minimum = Math.max(8, Math.ceil(claims.length * .15));
  if (grounded.length < minimum) {
    add(issues, "black-flower-claim-mix", "slides", `Claims sourcés non-proposal: ${grounded.length}/${claims.length}. Minimum: ${minimum}.`);
  }
  if (objective.length < 3) add(issues, "black-flower-objective-claims", "slides", "Au moins trois claims factuels, citations ou observations sourcés sont requis.");
  if (evidenceIds.size < 3) add(issues, "black-flower-evidence-diversity", "slides", "Au moins trois preuves distinctes doivent soutenir le diagnostic.");
}

function validateCompositionBindings(slides: readonly unknown[], issues: ValidationIssue[]): void {
  slides.forEach((slide, index) => {
    if (!isRecord(slide) || typeof slide.compositionFamily !== "string") return;
    const family = slide.compositionFamily as keyof typeof blackFlowerCompositionBindings;
    const allowed = blackFlowerCompositionBindings[family] as readonly string[] | undefined;
    if (!allowed?.includes(String(slide.type))) {
      add(issues, "black-flower-composition-binding", `slides[${index}].compositionFamily`, `La famille ${slide.compositionFamily} ne pilote pas le layout ${String(slide.type)}.`);
    }
  });
}

export function validateBlackFlowerContent(
  meta: UnknownRecord,
  slides: readonly unknown[],
  assets: unknown,
  issues: ValidationIssue[],
): void {
  validateNarrative(meta, slides, assets, issues);
  validateClaimIntegrity(slides, issues);
  validateCompositionBindings(slides, issues);
}
