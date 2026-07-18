import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SlideFrame } from "../src/components/SlideFrame";
import { imageTestDossier } from "../src/content/image-test";
import { validateDossier } from "../src/schema/validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const technicalId = "todo-technical-id";
const footerFixtureSlide = imageTestDossier.slides[1];
if (!footerFixtureSlide) throw new Error("Slide de footer absente.");
const noFooterSlide = { ...footerFixtureSlide, id: technicalId };
const noFooterMarkup = renderToStaticMarkup(createElement(SlideFrame, {
  children: createElement("div", null, "Contenu visible"),
  index: 0,
  slide: noFooterSlide,
  theme: imageTestDossier.theme,
  total: 1,
}));
assert.ok(!noFooterMarkup.replace(/<[^>]+>/g, "").includes(technicalId));

const invalidSlideId: unknown = structuredClone(imageTestDossier);
if (isRecord(invalidSlideId) && Array.isArray(invalidSlideId.slides) && isRecord(invalidSlideId.slides[0])) {
  invalidSlideId.slides[0].id = "Étrange ID";
}
assert.ok(validateDossier(invalidSlideId).some((entry) => entry.code === "slide-id-format"));

const collidingSlideIds: unknown = structuredClone(imageTestDossier);
if (isRecord(collidingSlideIds) && Array.isArray(collidingSlideIds.slides)
  && isRecord(collidingSlideIds.slides[0]) && isRecord(collidingSlideIds.slides[1])) {
  collidingSlideIds.slides[0].id = "é";
  collidingSlideIds.slides[1].id = "e";
}
assert.ok(validateDossier(collidingSlideIds).some((entry) => entry.code === "slide-id-output-collision"));

const nonFiniteTheme: unknown = structuredClone(imageTestDossier);
if (isRecord(nonFiniteTheme) && isRecord(nonFiniteTheme.theme) && isRecord(nonFiniteTheme.theme.motif)) {
  nonFiniteTheme.theme.motif.strokeWidth = Number.NaN;
  nonFiniteTheme.theme.motif.cornerRadius = Number.POSITIVE_INFINITY;
}
assert.ok(validateDossier(nonFiniteTheme).filter((entry) => entry.code === "theme-number").length >= 2);

console.log("Tests structure: footer technique, IDs de sortie et nombres finis validés.");
