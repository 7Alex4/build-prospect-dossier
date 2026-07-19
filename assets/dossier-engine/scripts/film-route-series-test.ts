import assert from "node:assert/strict";
import { blackFlowerValidationFixture } from "../src/content/black-flower-validation-fixture";
import type { CompositionFamily } from "../src/schema/types";
import { validateDossier } from "../src/schema/validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function root(value: unknown): UnknownRecord {
  if (!isRecord(value)) throw new Error("Fixture Black Flower invalide.");
  return value;
}

function slides(value: unknown): UnknownRecord[] {
  const entries = root(value).slides;
  if (!Array.isArray(entries) || !entries.every(isRecord)) throw new Error("Slides de fixture absentes.");
  return entries;
}

function meta(value: unknown): UnknownRecord {
  const valueMeta = root(value).meta;
  if (!isRecord(valueMeta)) throw new Error("Meta de fixture absente.");
  return valueMeta;
}

function routeSeries(count: number, family: CompositionFamily = "object-overlap"): unknown {
  const value: unknown = structuredClone(blackFlowerValidationFixture);
  const sourceSlides = slides(value);
  const routeTemplates = sourceSlides.filter((entry) => entry.type === "film-concept");
  const insertionIndex = sourceSlides.findIndex((entry) => entry.type === "film-concept");
  const fallback = routeTemplates[1] ?? routeTemplates[0];
  if (insertionIndex < 0 || !fallback) throw new Error("Routes de fixture absentes.");
  const routes = Array.from({ length: count }, (_, index): UnknownRecord => {
    const template = routeTemplates[index] ?? fallback;
    const route: UnknownRecord = structuredClone(template);
    route.id = `film-route-${String(index + 1).padStart(2, "0")}`;
    route.compositionFamily = family;
    return route;
  });
  const withoutRoutes = sourceSlides.filter((entry) => entry.type !== "film-concept");
  const orderedSlides = [
    ...withoutRoutes.slice(0, insertionIndex),
    ...routes,
    ...withoutRoutes.slice(insertionIndex),
  ];
  const firstStoryboard = orderedSlides.findIndex((entry) => entry.type === "storyboard");
  const activation = orderedSlides.findIndex((entry) => entry.type === "activation");
  if (firstStoryboard >= 0 && activation > firstStoryboard) {
    const [activationSlide] = orderedSlides.splice(activation, 1);
    if (activationSlide) orderedSlides.splice(firstStoryboard + 1, 0, activationSlide);
  }
  root(value).slides = orderedSlides;
  meta(value).creativeRouteCount = count;
  return value;
}

function hasIssue(value: unknown, code: string): boolean {
  return validateDossier(value).some((issue) => issue.code === code);
}

function slideByType(value: unknown, type: string): UnknownRecord {
  const match = slides(value).find((entry) => entry.type === type);
  if (!match) throw new Error(`Slide ${type} absente.`);
  return match;
}

for (const count of [2, 3, 4]) {
  const validSeries = routeSeries(count);
  const errors = validateDossier(validSeries).filter((issue) => issue.level === "error");
  assert.deepEqual(errors, [], `${count} routes contiguës devraient être valides.`);
}

const seriesWithThreeOutsideUses = routeSeries(4, "image-dominant");
slideByType(seriesWithThreeOutsideUses, "proof").compositionFamily = "image-dominant";
assert.ok(!hasIssue(seriesWithThreeOutsideUses, "black-flower-composition-overuse"));

const seriesWithFourOutsideUses: unknown = structuredClone(seriesWithThreeOutsideUses);
slideByType(seriesWithFourOutsideUses, "risk").compositionFamily = "image-dominant";
assert.ok(hasIssue(seriesWithFourOutsideUses, "black-flower-composition-overuse"));

const repeatedAtSeriesBoundary = routeSeries(2, "image-dominant");
slideByType(repeatedAtSeriesBoundary, "storyboard").compositionFamily = "image-dominant";
assert.ok(hasIssue(repeatedAtSeriesBoundary, "black-flower-adjacent-compositions"));
assert.ok(hasIssue(repeatedAtSeriesBoundary, "black-flower-composition-binding"));

const wrongDeclaredCount = routeSeries(2);
meta(wrongDeclaredCount).creativeRouteCount = 3;
assert.ok(hasIssue(wrongDeclaredCount, "black-flower-route-count"));
assert.ok(hasIssue(wrongDeclaredCount, "black-flower-adjacent-compositions"));

const fragmentedSeries = routeSeries(4);
const fragmentedSlides = slides(fragmentedSeries);
const displacedRoute = fragmentedSlides.splice(10, 1)[0];
if (!displacedRoute) throw new Error("Route à déplacer absente.");
fragmentedSlides.splice(14, 0, displacedRoute);
assert.ok(hasIssue(fragmentedSeries, "black-flower-adjacent-compositions"));
assert.ok(hasIssue(fragmentedSeries, "black-flower-composition-overuse"));

const oversizedSeries = routeSeries(5);
root(oversizedSeries).slides = slides(oversizedSeries).filter((entry) => entry.type !== "manifesto");
assert.ok(hasIssue(oversizedSeries, "black-flower-adjacent-compositions"));
assert.ok(hasIssue(oversizedSeries, "black-flower-composition-overuse"));

const incompatibleSeries = routeSeries(2, "portrait-profile");
assert.ok(hasIssue(incompatibleSeries, "black-flower-composition-binding"));
assert.ok(hasIssue(incompatibleSeries, "black-flower-adjacent-compositions"));

console.log("Tests séries film: exception 2–4 routes et protections hors série validées.");
