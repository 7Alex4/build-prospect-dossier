import { clientFacingAuditStrings, structuralAuditStrings } from "./content-claims";
import { compositionFamilies } from "./profile-types";
import type { DossierSlide } from "./types";
import type { ValidationIssue } from "./validation";

type UnknownRecord = Record<string, unknown>;

const canonicalStudio = "Black Flower Creative House";
const studioSignature = "BlackFlower";
const runningHeader = "Strategic creative campaign proposal · BlackFlower";
const visualIntents = ["image-led", "image-supported", "typographic", "diagram"] as const;
const diagramTypes = new Set(["architecture", "platform", "timeline"]);
const meaningfulRoles = new Set([
  "hero", "evidence", "editorial", "product", "portrait", "film-still",
  "storyboard-frame", "reference",
]);
const meaningfulNatures = new Set([
  "photograph", "product-cutout", "screenshot", "document", "archive",
  "illustration", "storyboard", "portrait",
]);

interface ContentImage {
  readonly image: UnknownRecord;
  readonly path: string;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function add(
  issues: ValidationIssue[],
  level: ValidationIssue["level"],
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ level, code, path, message });
}

function pushImage(images: ContentImage[], value: unknown, path: string): void {
  if (isRecord(value)) images.push({ image: value, path });
}

function directImage(slide: UnknownRecord, path: string): ContentImage[] {
  const images: ContentImage[] = [];
  pushImage(images, slide.image, `${path}.image`);
  return images;
}

function nestedImages(slide: UnknownRecord, path: string): ContentImage[] {
  const images = directImage(slide, path);
  pushImage(images, slide.productCutout, `${path}.productCutout`);
  const collections: ReadonlyArray<readonly [unknown, string]> = [
    [slide.frames, "frames"],
    [slide.references, "references"],
    [slide.steps, "steps"],
  ];
  collections.forEach(([collection, key]) => {
    if (!Array.isArray(collection)) return;
    collection.forEach((entry, index) => {
      if (isRecord(entry)) pushImage(images, entry.image, `${path}.${key}[${index}].image`);
    });
  });
  return images;
}

function validateRequiredMedia(slides: readonly unknown[], issues: ValidationIssue[]): void {
  const required = new Set(["risk", "film-concept", "activation", "production"]);
  slides.forEach((entry, index) => {
    if (!isRecord(entry) || !required.has(String(entry.type))) return;
    if (directImage(entry, `slides[${index}]`).length === 0) {
      add(issues, "error", "black-flower-required-media", `slides[${index}].image`, `Une slide ${String(entry.type)} finale exige un média principal.`);
    }
  });
}

function validateIdentity(meta: UnknownRecord, theme: UnknownRecord, issues: ValidationIssue[]): void {
  if (meta.studio !== canonicalStudio) {
    add(issues, "error", "black-flower-studio", "meta.studio", `Valeur requise: ${canonicalStudio}.`);
  }
  if (!isRecord(meta.studioIdentity)) {
    add(issues, "error", "black-flower-identity", "meta.studioIdentity", "Identité studio explicite requise.");
  } else {
    if (meta.studioIdentity.canonicalName !== canonicalStudio) {
      add(issues, "error", "black-flower-identity", "meta.studioIdentity.canonicalName", `Valeur requise: ${canonicalStudio}.`);
    }
    if (meta.studioIdentity.signature !== studioSignature) {
      add(issues, "error", "black-flower-identity", "meta.studioIdentity.signature", `Valeur requise: ${studioSignature}.`);
    }
  }
  const header = isRecord(theme.chrome) && isRecord(theme.chrome.runningHeader)
    ? theme.chrome.runningHeader
    : undefined;
  if (!header || header.text !== runningHeader || header.align !== "left") {
    add(issues, "error", "black-flower-header", "theme.chrome.runningHeader", `En-tête gauche requis: ${runningHeader}.`);
  }
  if (!isRecord(theme.pageMarker) || theme.pageMarker.kind !== "number") {
    add(issues, "error", "black-flower-page-marker", "theme.pageMarker.kind", "Pagination numérique requise en bas à gauche.");
  }
}

function rejectForeignSignature(meta: UnknownRecord, theme: UnknownRecord, slides: readonly unknown[], issues: ValidationIssue[]): void {
  const entries: Array<{ path: string; value: string }> = [];
  if (nonEmpty(meta.studio)) entries.push({ path: "meta.studio", value: meta.studio });
  const identity = meta.studioIdentity;
  if (isRecord(identity)) {
    ["canonicalName", "signature"].forEach((key) => {
      const value = identity[key];
      if (nonEmpty(value)) entries.push({ path: `meta.studioIdentity.${key}`, value });
    });
  }
  slides.forEach((entry, index) => {
    if (!isRecord(entry)) return;
    clientFacingAuditStrings(entry as unknown as DossierSlide).forEach((visible) =>
      entries.push({ path: `slides[${index}].${visible.path}`, value: visible.value }),
    );
  });
  structuralAuditStrings(theme).forEach((visible) =>
    entries.push({ path: `theme.${visible.path}`, value: visible.value }),
  );
  entries.forEach((entry) => {
    if (entry.value.toLocaleLowerCase("fr").includes("nexaia")) {
      add(issues, "error", "black-flower-foreign-signature", entry.path, "Nexaia est interdit dans tout texte visible Black Flower.");
    }
  });
}

function validateMotif(theme: UnknownRecord, issues: ValidationIssue[]): void {
  if (!isRecord(theme.motif)) return;
  const motif = theme.motif;
  if (motif.kind !== "asset" && motif.kind !== "none") {
    add(issues, "error", "black-flower-generic-motif", "theme.motif.kind", "Utilisez un motif prospect-derived, typographique ou aucun motif.");
  }
  if (motif.kind === "asset" && motif.derivation !== "prospect-derived" && motif.derivation !== "typographic-system") {
    add(issues, "error", "black-flower-motif-derivation", "theme.motif.derivation", "Dérivation prospect-derived ou typographic-system requise.");
  }
}

function validateImageMetadata(entry: ContentImage, issues: ValidationIssue[]): void {
  if (!meaningfulRoles.has(String(entry.image.mediaRole))) {
    add(issues, "error", "black-flower-media-role", `${entry.path}.mediaRole`, "Rôle éditorial explicite requis.");
  }
  if (!meaningfulNatures.has(String(entry.image.mediaNature))) {
    add(issues, "error", "black-flower-media-nature", `${entry.path}.mediaNature`, "Nature de média explicite requise.");
  }
  if (entry.image.productionStatus !== "final") {
    add(issues, "error", "black-flower-media-final", `${entry.path}.productionStatus`, "Un média final est requis. Les placeholders sont interdits.");
  }
}

function validateFallbacks(slide: UnknownRecord, path: string, issues: ValidationIssue[]): void {
  if (slide.type === "references" && Array.isArray(slide.references)) {
    slide.references.forEach((reference, index) => {
      if (!isRecord(reference) || !isRecord(reference.image)) {
        add(issues, "error", "black-flower-reference-media", `${path}.references[${index}].image`, "Chaque référence finale exige une image.");
      }
    });
  }
  if (slide.type === "lockup" && !isRecord(slide.mark) && slide.textMark !== studioSignature) {
    add(issues, "error", "black-flower-lockup-signature", `${path}.textMark`, `Marque asset ou mot-symbole ${studioSignature} requis.`);
  }
  if (slide.type === "timeline" && slide.compositionFamily === "editorial-sequence" && Array.isArray(slide.steps)) {
    slide.steps.forEach((step, index) => {
      if (!isRecord(step) || !isRecord(step.image)) {
        add(issues, "error", "black-flower-sequence-media", `${path}.steps[${index}].image`, "Chaque étape d'une séquence éditoriale exige une image.");
      }
    });
  }
  if (slide.type === "film-concept" && isRecord(slide.productCutout)) {
    const cutout = slide.productCutout;
    if (cutout.presentation !== "cutout" || cutout.fit !== "contain" || cutout.mediaRole !== "product" || cutout.mediaNature !== "product-cutout") {
      add(issues, "error", "black-flower-product-cutout", `${path}.productCutout`, "Le produit superposé exige presentation=cutout, fit=contain, mediaRole=product et mediaNature=product-cutout.");
    }
  }
}

function validateCadence(slides: readonly unknown[], issues: ValidationIssue[]): void {
  let imageLed = 0;
  let diagram = 0;
  let mediaFreeRun = 0;
  let peaks = 0;
  const families = new Set<string>();
  const familyCounts = new Map<string, number>();
  let previousFamily: string | undefined;
  slides.forEach((entry, index) => {
    if (!isRecord(entry)) return;
    const path = `slides[${index}]`;
    const images = nestedImages(entry, path);
    const intent = entry.visualIntent;
    if (!visualIntents.includes(intent as typeof visualIntents[number])) {
      add(issues, "error", "black-flower-visual-intent", `${path}.visualIntent`, `Valeur requise: ${visualIntents.join(", ")}.`);
    }
    if (!nonEmpty(entry.visualIntentRationale)) {
      add(issues, "error", "black-flower-visual-rationale", `${path}.visualIntentRationale`, "Raison visuelle explicite requise.");
    }
    if (!compositionFamilies.includes(entry.compositionFamily as typeof compositionFamilies[number])) {
      add(issues, "error", "black-flower-composition-family", `${path}.compositionFamily`, "Famille de composition explicite requise.");
    } else {
      const family = String(entry.compositionFamily);
      families.add(family);
      const count = (familyCounts.get(family) ?? 0) + 1;
      familyCounts.set(family, count);
      if (count > 3) add(issues, "error", "black-flower-composition-overuse", `${path}.compositionFamily`, `La famille ${family} dépasse trois usages.`);
      if (family === previousFamily) add(issues, "error", "black-flower-adjacent-compositions", `${path}.compositionFamily`, `La famille ${family} ne peut pas se répéter sur deux pages consécutives.`);
      previousFamily = family;
    }
    if (typeof entry.visualPeak !== "boolean") {
      add(issues, "error", "black-flower-visual-peak", `${path}.visualPeak`, "Booléen visualPeak explicite requis.");
    } else if (entry.visualPeak) peaks += 1;
    if (intent === "image-led") imageLed += 1;
    if (intent === "diagram") {
      diagram += 1;
      if (!diagramTypes.has(String(entry.type))) {
        add(issues, "error", "black-flower-diagram-family", `${path}.visualIntent`, "Un diagramme est réservé aux pages architecture, platform ou timeline.");
      }
      const previous = slides[index - 1];
      if (isRecord(previous) && previous.visualIntent === "diagram") {
        add(issues, "error", "black-flower-adjacent-diagrams", `${path}.visualIntent`, "Deux diagrammes consécutifs sont interdits.");
      }
    }
    if ((intent === "image-led" || intent === "image-supported") && images.length === 0) {
      add(issues, "error", "black-flower-intent-media", `${path}.image`, `L'intention ${String(intent)} exige un média.`);
    }
    images.forEach((image) => validateImageMetadata(image, issues));
    validateFallbacks(entry, path, issues);
    mediaFreeRun = images.length > 0 ? 0 : mediaFreeRun + 1;
    if (mediaFreeRun > 2) add(issues, "error", "black-flower-media-cadence", path, "Maximum deux pages consécutives sans média.");
  });
  const ratio = slides.length === 0 ? 0 : imageLed / slides.length;
  if (ratio < .45 || ratio > .65) {
    add(issues, "error", "black-flower-image-led-ratio", "slides", `Pages image-led: ${Math.round(ratio * 100)}%. Plage requise: 45–65%.`);
  } else if (ratio < .5 || ratio > .6) {
    add(issues, "warning", "black-flower-image-led-target", "slides", `Pages image-led: ${Math.round(ratio * 100)}%. Cible Black Flower: 55%.`);
  }
  if (diagram > 2) add(issues, "error", "black-flower-diagram-cap", "slides", `${diagram} diagrammes. Maximum: 2.`);
  if (families.size < 6) add(issues, "error", "black-flower-composition-diversity", "slides", `${families.size} familles. Minimum: 6.`);
  if (peaks < 3) add(issues, "error", "black-flower-visual-peak-count", "slides", `${peaks} pics visuels. Minimum: 3.`);
}

function validateSourceMix(slides: readonly unknown[], assets: unknown, issues: ValidationIssue[]): void {
  const origins = new Map<string, string>();
  if (Array.isArray(assets)) assets.forEach((entry) => {
    if (isRecord(entry) && nonEmpty(entry.id) && nonEmpty(entry.origin)) origins.set(entry.id, entry.origin);
  });
  let visual = 0;
  let nonGenerated = 0;
  let generated = 0;
  slides.forEach((entry, index) => {
    if (!isRecord(entry) || (entry.visualIntent !== "image-led" && entry.visualIntent !== "image-supported")) return;
    visual += 1;
    const pageOrigins = nestedImages(entry, `slides[${index}]`).flatMap(({ image }) =>
      nonEmpty(image.id) && origins.has(image.id) ? [origins.get(image.id) as string] : [],
    );
    if (pageOrigins.some((origin) => origin !== "generated")) nonGenerated += 1;
    if (pageOrigins.some((origin) => origin === "generated")) generated += 1;
  });
  const nonGeneratedRatio = visual === 0 ? 0 : nonGenerated / visual;
  const generatedRatio = visual === 0 ? 0 : generated / visual;
  if (nonGeneratedRatio < .6) {
    add(issues, "error", "black-flower-non-generated-ratio", "slides", `Pages visuelles avec asset non généré: ${Math.round(nonGeneratedRatio * 100)}%. Minimum: 60%.`);
  }
  if (generatedRatio > .4) {
    add(issues, "error", "black-flower-generated-ratio", "slides", `Pages visuelles contenant un asset généré: ${Math.round(generatedRatio * 100)}%. Maximum: 40%.`);
  }
}

export function validateBlackFlowerProfile(value: UnknownRecord, issues: ValidationIssue[]): void {
  if (!isRecord(value.meta) || !Array.isArray(value.slides)) return;
  if (value.meta.stage !== "final" || value.meta.frameworkProfile !== "black-flower" || !isRecord(value.theme)) return;
  validateRequiredMedia(value.slides, issues);
  validateIdentity(value.meta, value.theme, issues);
  rejectForeignSignature(value.meta, value.theme, value.slides, issues);
  validateMotif(value.theme, issues);
  validateCadence(value.slides, issues);
  validateSourceMix(value.slides, value.assets, issues);
}
