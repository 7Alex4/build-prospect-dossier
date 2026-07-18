import type { ValidationIssue } from "./validation";
import { validateContact } from "./contact-validation";
import { validateImageShape as image } from "./image-shape-validation";
import { compositionFamilies } from "./profile-types";
import { validateThemeShape } from "./theme-nested-validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function add(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

function strings(
  record: UnknownRecord,
  keys: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  keys.forEach((key) => {
    if (typeof record[key] !== "string" || (record[key] as string).trim().length === 0) {
      add(issues, "nested-text", `${path}.${key}`, "Texte non vide requis.");
    }
  });
}

function allowed(
  value: unknown,
  values: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "string" || !values.includes(value)) {
    add(issues, "enum", path, `Valeur attendue: ${values.join(", ")}.`);
  }
}

function objectList(
  value: unknown,
  fields: readonly string[],
  path: string,
  issues: ValidationIssue[],
): UnknownRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!isRecord(item)) {
      add(issues, "nested-shape", `${path}[${index}]`, "Objet requis.");
      return [];
    }
    strings(item, fields, `${path}[${index}]`, issues);
    return [item];
  });
}

function stringList(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!Array.isArray(value)) return;
  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      add(issues, "nested-text", `${path}[${index}]`, "Texte non vide requis.");
    }
  });
}

function commonSlide(slide: UnknownRecord, path: string, issues: ValidationIssue[]): void {
  if (slide.visualIntent !== undefined) {
    allowed(
      slide.visualIntent,
      ["image-led", "image-supported", "typographic", "diagram"],
      `${path}.visualIntent`,
      issues,
    );
  }
  if (slide.visualIntentRationale !== undefined) {
    strings(slide, ["visualIntentRationale"], path, issues);
  }
  if (slide.compositionFamily !== undefined) {
    allowed(slide.compositionFamily, compositionFamilies, `${path}.compositionFamily`, issues);
  }
  if (slide.visualPeak !== undefined && typeof slide.visualPeak !== "boolean") {
    add(issues, "slide-boolean", `${path}.visualPeak`, "Booléen requis.");
  }
  if (slide.tone !== undefined) {
    allowed(slide.tone, ["paper", "ink", "accent", "surface", "signal"], `${path}.tone`, issues);
  }
  stringList(slide.evidenceIds, `${path}.evidenceIds`, issues);
  if (slide.motifState !== undefined) {
    allowed(slide.motifState, ["default", "full", "quiet", "hidden"], `${path}.motifState`, issues);
  }
  image(slide.chapterMark, `${path}.chapterMark`, issues);
  image(slide.productCutout, `${path}.productCutout`, issues);
  if (Array.isArray(slide.claims)) {
    slide.claims.forEach((claim, index) => {
      const claimPath = `${path}.claims[${index}]`;
      if (!isRecord(claim)) {
        add(issues, "claim-shape", claimPath, "Objet claim requis.");
        return;
      }
      strings(claim, ["text", "contentPath"], claimPath, issues);
      allowed(claim.kind, ["fact", "quote", "observation", "interpretation", "proposal"], `${claimPath}.kind`, issues);
      stringList(claim.evidenceIds, `${claimPath}.evidenceIds`, issues);
      if (["fact", "quote", "observation"].includes(String(claim.kind))
        && (!Array.isArray(claim.evidenceIds) || claim.evidenceIds.length === 0)) {
        add(issues, "claim-source", `${claimPath}.evidenceIds`, "Cette affirmation exige une source.");
      }
    });
  }
  image(slide.image, `${path}.image`, issues);
}

function nestedSlide(slide: UnknownRecord, path: string, issues: ValidationIssue[]): void {
  commonSlide(slide, path, issues);
  switch (slide.type) {
    case "architecture":
      objectList(slide.nodes, ["label", "detail"], `${path}.nodes`, issues).forEach((node, index) => {
        if (node.kind !== undefined) allowed(node.kind, ["input", "core", "output"], `${path}.nodes[${index}].kind`, issues);
      });
      break;
    case "three-columns":
      objectList(slide.columns, ["title", "body"], `${path}.columns`, issues);
      break;
    case "manifesto":
      stringList(slide.lines, `${path}.lines`, issues);
      break;
    case "proof":
      objectList(slide.metrics, ["value", "label"], `${path}.metrics`, issues);
      stringList(slide.proofPoints, `${path}.proofPoints`, issues);
      break;
    case "risk":
      objectList(slide.risks, ["label", "consequence"], `${path}.risks`, issues).forEach((risk, index) => {
        if (risk.severity !== 1 && risk.severity !== 2 && risk.severity !== 3) {
          add(issues, "severity", `${path}.risks[${index}].severity`, "Niveau 1, 2 ou 3 requis.");
        }
      });
      break;
    case "opportunity":
      objectList(slide.shifts, ["from", "to", "implication"], `${path}.shifts`, issues);
      break;
    case "platform":
      if (isRecord(slide.core)) strings(slide.core, ["label", "detail"], `${path}.core`, issues);
      objectList(slide.layers, ["label", "detail"], `${path}.layers`, issues);
      stringList(slide.outcomes, `${path}.outcomes`, issues);
      break;
    case "timeline":
      objectList(slide.steps, ["phase", "duration", "title", "detail"], `${path}.steps`, issues)
        .forEach((step, index) => image(step.image, `${path}.steps[${index}].image`, issues));
      break;
    case "film-concept":
      stringList(slide.toneWords, `${path}.toneWords`, issues);
      break;
    case "activation":
      objectList(slide.channels, ["name", "role", "asset"], `${path}.channels`, issues);
      stringList(slide.sequence, `${path}.sequence`, issues);
      break;
    case "storyboard":
      if (slide.duration !== undefined) strings(slide, ["duration"], path, issues);
      objectList(slide.frames, ["number", "beat", "visual"], `${path}.frames`, issues).forEach((frame, index) => {
        if (slide.duration !== undefined) strings(frame, ["timecode"], `${path}.frames[${index}]`, issues);
        else if (frame.timecode !== undefined) strings(frame, ["timecode"], `${path}.frames[${index}]`, issues);
        image(frame.image, `${path}.frames[${index}].image`, issues);
      });
      break;
    case "production":
      objectList(slide.workstreams, ["name", "detail"], `${path}.workstreams`, issues);
      stringList(slide.deliverables, `${path}.deliverables`, issues);
      stringList(slide.constraints, `${path}.constraints`, issues);
      break;
    case "references":
      objectList(slide.references, ["title", "reason", "source"], `${path}.references`, issues).forEach((reference, index) =>
        image(reference.image, `${path}.references[${index}].image`, issues),
      );
      break;
    case "thank-you":
      validateContact(slide.contact, `${path}.contact`, issues);
      break;
    case "lockup":
      if (slide.title !== undefined) strings(slide, ["title"], path, issues);
      if (slide.statement !== undefined) strings(slide, ["statement"], path, issues);
      if (slide.textMark !== undefined) strings(slide, ["textMark"], path, issues);
      image(slide.mark, `${path}.mark`, issues);
      break;
  }
}

export function validateNestedDossier(value: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(value)) return;
  validateThemeShape(value.theme, issues);
  if (isRecord(value.meta) && value.meta.confidential !== undefined && typeof value.meta.confidential !== "boolean") {
    add(issues, "meta-boolean", "meta.confidential", "Booléen requis.");
  }
  if (!Array.isArray(value.slides)) return;
  value.slides.forEach((slide, index) => {
    if (isRecord(slide)) nestedSlide(slide, `slides[${index}]`, issues);
  });
}
