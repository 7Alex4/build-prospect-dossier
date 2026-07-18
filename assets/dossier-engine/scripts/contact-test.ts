import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThankYou } from "../src/components/slides/ClosingSlides";
import { imageTestDossier } from "../src/content/image-test";
import type { ThankYouSlide } from "../src/schema/types";
import { validateDossier } from "../src/schema/validation";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function dossierWithContact(contact: UnknownRecord): unknown {
  const value: unknown = structuredClone(imageTestDossier);
  if (!isRecord(value) || !Array.isArray(value.slides)) throw new Error("Fixture absente.");
  const slide = value.slides.find((entry) => isRecord(entry) && entry.type === "thank-you");
  if (!isRecord(slide)) throw new Error("Slide de contact absente.");
  slide.contact = contact;
  return value;
}

const valid = dossierWithContact({
  name: "Contact Démo",
  role: "Direction créative",
  email: "bonjour@studio-demo.invalid",
  phone: "+41 32 123 45 67",
  website: "https://studio-demo.invalid/contact",
});
assert.equal(validateDossier(valid).filter((entry) => entry.level === "error").length, 0);

const invalidEmail = dossierWithContact({ name: "Test", role: "Test", email: "pas-un-email" });
assert.ok(validateDossier(invalidEmail).some((entry) => entry.code === "contact-email"));

const invalidWebsite = dossierWithContact({
  name: "Test",
  role: "Test",
  email: "test@example.invalid",
  website: "javascript:alert(1)",
});
assert.ok(validateDossier(invalidWebsite).some((entry) => entry.code === "contact-website"));

const invalidPhone = dossierWithContact({
  name: "Test",
  role: "Test",
  email: "test@example.invalid",
  phone: "javascript:alert(1)",
});
assert.ok(validateDossier(invalidPhone).some((entry) => entry.code === "contact-phone"));

const safeSlide: ThankYouSlide = {
  id: "contact-safe",
  type: "thank-you",
  title: "Contact",
  message: "Coordonnées",
  contact: {
    name: "Contact Démo",
    role: "Direction créative",
    email: "bonjour+demo@studio-demo.invalid",
    phone: "+41 32 123 45 67",
    website: "https://studio-demo.invalid",
  },
};
const safeMarkup = renderToStaticMarkup(createElement(ThankYou, { slide: safeSlide }));
assert.ok(safeMarkup.includes('href="mailto:bonjour%2Bdemo@studio-demo.invalid"'));
assert.ok(safeMarkup.includes('href="tel:+41321234567"'));
assert.ok(safeMarkup.includes('href="https://studio-demo.invalid"'));

const unsafeSlide: ThankYouSlide = {
  ...safeSlide,
  contact: {
    name: "Contact Démo",
    role: "Direction créative",
    email: "bad",
    phone: "bad",
    website: "javascript:bad",
  },
};
const unsafeMarkup = renderToStaticMarkup(createElement(ThankYou, { slide: unsafeSlide }));
assert.ok(!unsafeMarkup.includes("href="));

console.log("Tests contact: email, site HTTP(S) et lien tel sûr validés.");
