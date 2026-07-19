import { blackFlowerCompositionBindings } from "./black-flower-content-validation";
import { compositionFamilies } from "./profile-types";
import type { ValidationIssue } from "./validation";

type UnknownRecord = Record<string, unknown>;

interface FilmRouteSeries {
  readonly family: string;
  readonly indices: ReadonlySet<number>;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCompositionFamily(value: unknown): value is typeof compositionFamilies[number] {
  return compositionFamilies.includes(value as typeof compositionFamilies[number]);
}

function supportsFilmConcept(family: typeof compositionFamilies[number]): boolean {
  const allowed = blackFlowerCompositionBindings[family as keyof typeof blackFlowerCompositionBindings] as readonly string[] | undefined;
  return allowed?.includes("film-concept") ?? false;
}

function eligibleFilmRouteSeries(meta: UnknownRecord, slides: readonly unknown[]): FilmRouteSeries | undefined {
  const declared = meta.creativeRouteCount;
  if (typeof declared !== "number" || !Number.isInteger(declared) || declared < 2 || declared > 4) return undefined;
  const routeIndices = slides.flatMap((slide, index) =>
    isRecord(slide) && slide.type === "film-concept" ? [index] : [],
  );
  if (routeIndices.length !== declared) return undefined;
  const firstIndex = routeIndices[0];
  if (firstIndex === undefined || routeIndices.some((index, offset) => index !== firstIndex + offset)) return undefined;
  const firstSlide = slides[firstIndex];
  if (!isRecord(firstSlide) || !isCompositionFamily(firstSlide.compositionFamily)) return undefined;
  const family = firstSlide.compositionFamily;
  if (!supportsFilmConcept(family)) return undefined;
  if (routeIndices.some((index) => {
    const slide = slides[index];
    return !isRecord(slide) || slide.compositionFamily !== family;
  })) return undefined;
  return { family, indices: new Set(routeIndices) };
}

function add(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

export function validateCompositionCadence(
  meta: UnknownRecord,
  slides: readonly unknown[],
  issues: ValidationIssue[],
): void {
  const routeSeries = eligibleFilmRouteSeries(meta, slides);
  const families = new Set<string>();
  const outsideSeriesCounts = new Map<string, number>();
  let previousFamily: string | undefined;
  slides.forEach((slide, index) => {
    if (!isRecord(slide)) return;
    const path = `slides[${index}].compositionFamily`;
    if (!isCompositionFamily(slide.compositionFamily)) {
      add(issues, "black-flower-composition-family", path, "Famille de composition explicite requise.");
      return;
    }
    const family = slide.compositionFamily;
    families.add(family);
    if (!routeSeries?.indices.has(index)) {
      const count = (outsideSeriesCounts.get(family) ?? 0) + 1;
      outsideSeriesCounts.set(family, count);
      if (count > 3) {
        add(issues, "black-flower-composition-overuse", path, `La famille ${family} dépasse trois usages hors série film admissible.`);
      }
    }
    const repeatsInsideSeries = family === routeSeries?.family
      && routeSeries.indices.has(index)
      && routeSeries.indices.has(index - 1);
    if (family === previousFamily && !repeatsInsideSeries) {
      add(issues, "black-flower-adjacent-compositions", path, `La famille ${family} ne peut pas se répéter hors série film admissible.`);
    }
    previousFamily = family;
  });
  if (families.size < 6) {
    add(issues, "black-flower-composition-diversity", "slides", `${families.size} familles. Minimum: 6.`);
  }
}
