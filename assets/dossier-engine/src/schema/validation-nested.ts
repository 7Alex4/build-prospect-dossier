import type { ValidationIssue } from "./validation";
import { validateContact } from "./contact-validation";

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

function image(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    add(issues, "image-shape", path, "Objet image requis.");
    return;
  }
  strings(value, ["src", "alt"], path, issues);
  if (value.fit !== undefined) allowed(value.fit, ["cover", "contain"], `${path}.fit`, issues);
  if (value.treatment !== undefined) {
    allowed(value.treatment, ["natural", "mono", "duotone"], `${path}.treatment`, issues);
  }
}

function requiredImage(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (value === undefined) {
    add(issues, "image-required", path, "Image requise.");
    return;
  }
  image(value, path, issues);
}

function numberInRange(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  minimum: number,
  maximum: number,
): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    add(issues, "theme-number", path, `Nombre entre ${minimum} et ${maximum} requis.`);
  }
}

function theme(value: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(value)) return;
  if (isRecord(value.palette)) {
    strings(value.palette, ["ink", "paper", "accent", "muted", "surface", "signal"], "theme.palette", issues);
  } else add(issues, "theme-shape", "theme.palette", "Objet palette requis.");
  if (isRecord(value.typography)) {
    strings(value.typography, ["display", "body", "mono"], "theme.typography", issues);
  } else add(issues, "theme-shape", "theme.typography", "Objet typographie requis.");
  if (isRecord(value.motif)) {
    allowed(value.motif.kind, ["frame", "orbit", "grid", "signal", "asset", "none"], "theme.motif.kind", issues);
    allowed(value.motif.density, ["quiet", "balanced", "bold"], "theme.motif.density", issues);
    numberInRange(value.motif.strokeWidth, "theme.motif.strokeWidth", issues, 0, 12);
    numberInRange(value.motif.cornerRadius, "theme.motif.cornerRadius", issues, 0, 240);
    if (typeof value.motif.showIndex !== "boolean") {
      add(issues, "theme-boolean", "theme.motif.showIndex", "Booléen requis.");
    }
    if (value.motif.kind === "asset") {
      if (isRecord(value.motif.assets)) {
        requiredImage(value.motif.assets.full, "theme.motif.assets.full", issues);
        image(value.motif.assets.quiet, "theme.motif.assets.quiet", issues);
      } else add(issues, "theme-shape", "theme.motif.assets", "Asset full requis, asset quiet optionnel.");
    }
    if (value.motif.placement !== undefined) {
      if (isRecord(value.motif.placement)) {
        numberInRange(value.motif.placement.x, "theme.motif.placement.x", issues, -2000, 4000);
        numberInRange(value.motif.placement.y, "theme.motif.placement.y", issues, -1414, 2828);
        numberInRange(value.motif.placement.width, "theme.motif.placement.width", issues, 1, 4000);
        numberInRange(value.motif.placement.height, "theme.motif.placement.height", issues, 1, 2828);
      } else add(issues, "theme-shape", "theme.motif.placement", "Placement objet requis.");
    }
  } else add(issues, "theme-shape", "theme.motif", "Objet motif requis.");
  if (isRecord(value.logo)) {
    strings(value.logo, ["textFallback"], "theme.logo", issues);
    image(value.logo.mark, "theme.logo.mark", issues);
    image(value.logo.wordmark, "theme.logo.wordmark", issues);
  } else add(issues, "theme-shape", "theme.logo", "Objet logo requis.");
  if (value.backgrounds !== undefined) {
    if (isRecord(value.backgrounds)) {
      const backgrounds = value.backgrounds;
      ["paper", "ink", "accent", "surface", "signal"].forEach((tone) =>
        image(backgrounds[tone], `theme.backgrounds.${tone}`, issues),
      );
    } else add(issues, "theme-shape", "theme.backgrounds", "Objet de fonds requis.");
  }
  if (value.pageMarker !== undefined) {
    if (isRecord(value.pageMarker)) {
      allowed(value.pageMarker.kind, ["number", "rotating-asset", "none"], "theme.pageMarker.kind", issues);
      if (value.pageMarker.kind === "rotating-asset") {
        requiredImage(value.pageMarker.asset, "theme.pageMarker.asset", issues);
      }
      if (value.pageMarker.startAngle !== undefined) {
        numberInRange(value.pageMarker.startAngle, "theme.pageMarker.startAngle", issues, -3600, 3600);
      }
      if (value.pageMarker.stepAngle !== undefined) {
        numberInRange(value.pageMarker.stepAngle, "theme.pageMarker.stepAngle", issues, -360, 360);
      }
    } else add(issues, "theme-shape", "theme.pageMarker", "Objet marqueur requis.");
  }
  if (value.chrome !== undefined) {
    if (isRecord(value.chrome)) {
      allowed(value.chrome.footer, ["bordered", "minimal", "hidden"], "theme.chrome.footer", issues);
      if (value.chrome.runningHeader !== undefined) {
        if (isRecord(value.chrome.runningHeader)) {
          strings(value.chrome.runningHeader, ["text"], "theme.chrome.runningHeader", issues);
          allowed(value.chrome.runningHeader.align, ["left", "center", "right"], "theme.chrome.runningHeader.align", issues);
          if (typeof value.chrome.runningHeader.showOnCover !== "boolean") {
            add(issues, "theme-boolean", "theme.chrome.runningHeader.showOnCover", "Booléen requis.");
          }
        } else add(issues, "theme-shape", "theme.chrome.runningHeader", "Objet en-tête requis.");
      }
    } else add(issues, "theme-shape", "theme.chrome", "Objet chrome requis.");
  }
}

function commonSlide(slide: UnknownRecord, path: string, issues: ValidationIssue[]): void {
  if (slide.tone !== undefined) {
    allowed(slide.tone, ["paper", "ink", "accent", "surface", "signal"], `${path}.tone`, issues);
  }
  stringList(slide.evidenceIds, `${path}.evidenceIds`, issues);
  if (slide.motifState !== undefined) {
    allowed(slide.motifState, ["default", "full", "quiet", "hidden"], `${path}.motifState`, issues);
  }
  image(slide.chapterMark, `${path}.chapterMark`, issues);
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
      objectList(slide.steps, ["phase", "duration", "title", "detail"], `${path}.steps`, issues);
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
      image(slide.mark, `${path}.mark`, issues);
      break;
  }
}

export function validateNestedDossier(value: unknown, issues: ValidationIssue[]): void {
  if (!isRecord(value)) return;
  theme(value.theme, issues);
  if (isRecord(value.meta) && value.meta.confidential !== undefined && typeof value.meta.confidential !== "boolean") {
    add(issues, "meta-boolean", "meta.confidential", "Booléen requis.");
  }
  if (!Array.isArray(value.slides)) return;
  value.slides.forEach((slide, index) => {
    if (isRecord(slide)) nestedSlide(slide, `slides[${index}]`, issues);
  });
}
