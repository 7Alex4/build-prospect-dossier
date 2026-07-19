import type { ValidationIssue } from "./validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function add(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

function normalized(value: unknown): string {
  return typeof value === "string"
    ? value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim()
    : "";
}

function wordCount(values: readonly unknown[]): number {
  return values.filter(nonEmpty).join(" ").trim().split(/\s+/u).filter(Boolean).length;
}

function forbiddenKeys(
  slide: UnknownRecord,
  keys: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  keys.forEach((key) => {
    if (Object.hasOwn(slide, key)) {
      add(issues, "black-flower-finish-silence", `${path}.${key}`, `Champ interdit sur ce master: ${key}.`);
    }
  });
}

function exactImage(
  image: unknown,
  role: string,
  nature: string,
  presentation: "cutout" | "frame",
  path: string,
  issues: ValidationIssue[],
): void {
  if (!isRecord(image)) {
    add(issues, "black-flower-finish-image", path, "Asset final requis.");
    return;
  }
  if (image.mediaRole !== role || image.mediaNature !== nature || image.productionStatus !== "final"
    || image.fit !== "contain" || image.presentation !== presentation) {
    add(
      issues,
      "black-flower-finish-image",
      path,
      `Asset requis: mediaRole=${role}, mediaNature=${nature}, productionStatus=final, fit=contain, presentation=${presentation}.`,
    );
  }
}

function portraitSafety(image: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isRecord(image)) return;
  const dimensions = image.sourceDimensions;
  const safeBox = image.subjectSafeBox;
  if (!isRecord(dimensions) || typeof dimensions.width !== "number" || typeof dimensions.height !== "number") {
    add(issues, "black-flower-portrait-dimensions", `${path}.sourceDimensions`, "Dimensions source obligatoires pour un portrait.");
  } else {
    const ratio = dimensions.width / dimensions.height;
    if (ratio < .65 || ratio > 1) {
      add(issues, "black-flower-portrait-ratio", `${path}.sourceDimensions`, `Portrait vertical isolé requis, ratio 0.65 à 1. Reçu: ${ratio.toFixed(2)}.`);
    }
  }
  if (!isRecord(safeBox)
    || typeof safeBox.x !== "number" || typeof safeBox.width !== "number"
    || typeof safeBox.y !== "number" || typeof safeBox.height !== "number"
    || safeBox.x < .03 || safeBox.x + safeBox.width > .97
    || safeBox.y < .03 || safeBox.y + safeBox.height > .97) {
    add(issues, "black-flower-portrait-safe-box", `${path}.subjectSafeBox`, "Safe box requise avec 3% d'air minimum autour du sujet.");
  }
}

function validateProduction(slide: UnknownRecord, path: string, issues: ValidationIssue[]): void {
  if (slide.variant !== "black-flower-portrait") {
    add(issues, "black-flower-production-master", `${path}.variant`, "Master black-flower-portrait obligatoire.");
    return;
  }
  if (normalized(slide.title) !== "production blackflower") {
    add(issues, "black-flower-production-title", `${path}.title`, "Titre exact requis: PRODUCTION BLACKFLOWER.");
  }
  const taglineWords = wordCount([slide.lead]);
  if (taglineWords < 2 || taglineWords > 8) {
    add(issues, "black-flower-production-tagline", `${path}.lead`, `Tagline de 2 à 8 mots requise. Reçu: ${taglineWords}.`);
  }
  if (!Array.isArray(slide.approach) || slide.approach.length < 3 || slide.approach.length > 5) {
    add(issues, "black-flower-production-approach", `${path}.approach`, "Notre approche exige 3 à 5 points.");
  }
  ["lead", "role", "strength", "portraitCaption"].forEach((key) => {
    if (!nonEmpty(slide[key])) add(issues, "black-flower-production-copy", `${path}.${key}`, "Texte requis.");
  });
  exactImage(slide.image, "portrait", "portrait", "frame", `${path}.image`, issues);
  portraitSafety(slide.image, `${path}.image`, issues);
  forbiddenKeys(slide, ["workstreams", "deliverables", "constraints"], path, issues);
  if (slide.compositionFamily !== "portrait-profile" || slide.visualIntent !== "image-led") {
    add(issues, "black-flower-production-composition", path, "Composition portrait-profile et intention image-led requises.");
  }
}

function thankHasProspectObject(slide: UnknownRecord, theme: UnknownRecord): boolean {
  if (isRecord(slide.image)) return true;
  return isRecord(theme.motif) && theme.motif.kind === "asset" && slide.motifState === "full";
}

function validateThankYou(
  slide: UnknownRecord,
  theme: UnknownRecord,
  path: string,
  issues: ValidationIssue[],
): void {
  if (slide.variant !== "black-flower-letter") {
    add(issues, "black-flower-thanks-master", `${path}.variant`, "Master black-flower-letter obligatoire.");
    return;
  }
  if (normalized(slide.title) !== "merci") {
    add(issues, "black-flower-thanks-title", `${path}.title`, "Titre exact requis: MERCI, sans ponctuation.");
  }
  const paragraphs = Array.isArray(slide.paragraphs) ? slide.paragraphs : [];
  const words = wordCount([...paragraphs, slide.closing]);
  if (paragraphs.length < 3 || paragraphs.length > 4 || words < 75 || words > 135) {
    add(issues, "black-flower-thanks-letter", `${path}.paragraphs`, `Lettre requise: 3 à 4 paragraphes et 75 à 135 mots. Reçu: ${words} mots.`);
  }
  if (!normalized(slide.closing).startsWith("merci encore et a bientot")) {
    add(issues, "black-flower-thanks-closing", `${path}.closing`, "Clôture requise: Merci encore et à bientôt !");
  }
  if (!thankHasProspectObject(slide, theme)) {
    add(issues, "black-flower-thanks-object", `${path}.image`, "Retour du motif ou d'un objet prospect obligatoire à droite.");
  }
  if (isRecord(slide.image) && (slide.image.fit !== "contain" || slide.image.productionStatus !== "final")) {
    add(issues, "black-flower-thanks-object", `${path}.image`, "L'objet de clôture doit être final et rendu en contain.");
  }
  forbiddenKeys(slide, ["eyebrow", "message", "contact", "nextStep"], path, issues);
  if (slide.compositionFamily !== "closing-letter" || slide.tone === "accent" || slide.tone === "signal") {
    add(issues, "black-flower-thanks-composition", path, "Closing-letter sur champ sobre requis.");
  }
}

function validateLockup(slide: UnknownRecord, path: string, issues: ValidationIssue[]): void {
  if (slide.variant !== "black-flower-co-mark") {
    add(issues, "black-flower-lockup-master", `${path}.variant`, "Master black-flower-co-mark obligatoire.");
    return;
  }
  exactImage(slide.clientMark, "identity", "brand-mark", "cutout", `${path}.clientMark`, issues);
  exactImage(slide.studioMark, "identity", "brand-mark", "cutout", `${path}.studioMark`, issues);
  if (slide.separator !== "times") {
    add(issues, "black-flower-lockup-separator", `${path}.separator`, "Séparateur × requis entre les deux marques.");
  }
  forbiddenKeys(
    slide,
    ["title", "statement", "studio", "mark", "textMark", "legal", "relationshipLabel", "eyebrow", "footer", "chapterMark"],
    path,
    issues,
  );
  if (slide.compositionFamily !== "lockup" || slide.visualIntent !== "typographic") {
    add(issues, "black-flower-lockup-composition", path, "Composition lockup silencieuse requise.");
  }
}

function validateBackgroundRhythm(
  meta: UnknownRecord,
  slides: readonly unknown[],
  issues: ValidationIssue[],
): void {
  const rhythm = meta.backgroundRhythm;
  if (rhythm !== "stable" && rhythm !== "binary-chapter") {
    add(issues, "black-flower-background-rhythm", "meta.backgroundRhythm", "Rythme stable ou binary-chapter requis.");
    return;
  }
  const fields: string[] = [];
  const tonesByField = new Map<string, Set<string>>();
  slides.forEach((slide, index) => {
    if (!isRecord(slide) || (slide.backgroundField !== "cover" && slide.backgroundField !== "body")) {
      add(issues, "black-flower-background-field", `slides[${index}].backgroundField`, "Champ cover ou body requis.");
      return;
    }
    fields.push(slide.backgroundField);
    if (typeof slide.tone === "string") {
      const tones = tonesByField.get(slide.backgroundField) ?? new Set<string>();
      tones.add(slide.tone);
      tonesByField.set(slide.backgroundField, tones);
    }
  });
  tonesByField.forEach((tones, field) => {
    if (tones.size > 1) {
      add(
        issues,
        "black-flower-background-field-drift",
        "slides",
        `Le champ ${field} doit conserver un seul token de fond. Reçus: ${[...tones].join(", ")}.`,
      );
    }
  });
  const transitions = fields.slice(1).filter((field, index) => field !== fields[index]).length;
  if (rhythm === "stable" && transitions > 4) {
    add(issues, "black-flower-background-transitions", "slides", `${transitions} changements de champ. Maximum stable: 4.`);
  }
  if (fields.length > 1 && fields[0] !== fields.at(-1)) {
    add(issues, "black-flower-background-loop", "slides", "Le lockup final doit reprendre le champ de couverture.");
  }
  const first = slides[0];
  const last = slides.at(-1);
  if (isRecord(first) && isRecord(last) && first.tone !== last.tone) {
    add(issues, "black-flower-background-loop", "slides", "Le lockup final doit reprendre exactement le token de fond de la couverture.");
  }
  if (rhythm === "binary-chapter") {
    fields.slice(1).forEach((field, index) => {
      if (field === fields[index]) return;
      const target = slides[index + 1];
      if (!isRecord(target) || (!target.visualPeak && !["cover", "manifesto", "film-concept", "lockup"].includes(String(target.type)))) {
        add(issues, "black-flower-background-chapter", `slides[${index + 1}].backgroundField`, "Chaque bascule doit ouvrir un chapitre ou un pic visuel.");
      }
    });
  }
}

export function validateBlackFlowerFinishing(
  meta: UnknownRecord,
  slides: readonly unknown[],
  theme: UnknownRecord,
  issues: ValidationIssue[],
): void {
  validateBackgroundRhythm(meta, slides, issues);
  const required = ["production", "thank-you", "lockup"];
  required.forEach((type) => {
    const matches = slides.flatMap((slide, index) =>
      isRecord(slide) && slide.type === type ? [{ slide, index }] : [],
    );
    if (matches.length !== 1) {
      add(issues, "black-flower-finish-master-count", "slides", `Une seule slide ${type} est requise.`);
      return;
    }
    const match = matches[0];
    if (!match) return;
    const { slide, index } = match;
    const path = `slides[${index}]`;
    if (type === "production") validateProduction(slide, path, issues);
    if (type === "thank-you") validateThankYou(slide, theme, path, issues);
    if (type === "lockup") validateLockup(slide, path, issues);
  });
}
