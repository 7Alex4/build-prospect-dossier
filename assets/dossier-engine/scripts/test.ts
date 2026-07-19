import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { App } from "../src/App";
import { AssetImage } from "../src/components/primitives";
import { exampleDossier } from "../src/content/example";
import { imageTestDossier } from "../src/content/image-test";
import { neutralProofImage } from "../src/content/neutral-assets";
import { validateDossier } from "../src/schema/validation";
import { collectAssets } from "./lib/input";
import { A4_LANDSCAPE, createDossierPdf, fitWithinA4 } from "./lib/pdf";
import { createPreviewDataScript, parsePreviewInput, previewDataPlugin } from "./lib/preview";
import "./claim-test";
import "./contact-test";
import "./governance-test";
import "./asset-test";
import "./input-test";
import "./render-integrity-test";
import "./structural-test";
import "./black-flower-test";
import "./film-route-series-test";
import "./finish-master-validation-test";
import "./composition-layout-test";
import "./finish-master-layout-test";
import "./font-test";
import "./black-flower-source-test";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function slideRecord(value: unknown, type: string): Record<string, unknown> | undefined {
  if (!isRecord(value) || !Array.isArray(value.slides)) return undefined;
  const found = value.slides.find((slide) => isRecord(slide) && slide.type === type);
  return isRecord(found) ? found : undefined;
}

const validIssues = validateDossier(exampleDossier);
assert.equal(validIssues.filter((entry) => entry.level === "error").length, 0);
assert.equal(exampleDossier.slides.length, 18);
assert.equal(new Set(exampleDossier.slides.map((slide) => slide.id)).size, 18);
assert.deepEqual(exampleDossier.slides.slice(0, 4).map((slide) => slide.type), [
  "cover",
  "architecture",
  "three-columns",
  "proof",
]);
assert.equal(parsePreviewInput([]), "src/content/example.ts");
assert.equal(parsePreviewInput(["src/content/deck.ts"]), "src/content/deck.ts");
assert.throws(() => parsePreviewInput(["one.ts", "two.ts"]));
const previewFixture = structuredClone(exampleDossier);
previewFixture.meta.title = "</script><script>test</script>";
const previewScript = createPreviewDataScript(previewFixture);
assert.ok(!previewScript.includes("</script>"));
assert.equal(previewDataPlugin(exampleDossier).name, "prospect-dossier-preview-data");

const broken = structuredClone(exampleDossier) as unknown;
if (typeof broken === "object" && broken !== null && "slides" in broken && Array.isArray(broken.slides)) {
  broken.slides[0] = { id: "broken", type: "cover", title: "Incomplet" };
}
const brokenIssues = validateDossier(broken);
assert.ok(brokenIssues.some((entry) => entry.code === "required-text"));

const representedTypes: ReadonlySet<string> = new Set<string>(exampleDossier.slides.map((slide) => slide.type));
const requiredTypes = [
  "cover",
  "architecture",
  "three-columns",
  "manifesto",
  "proof",
  "risk",
  "opportunity",
  "platform",
  "timeline",
  "film-concept",
  "activation",
  "storyboard",
  "production",
  "references",
  "thank-you",
  "lockup",
];
requiredTypes.forEach((type) => assert.ok(representedTypes.has(type), `Famille absente: ${type}`));

const imageIssues = validateDossier(imageTestDossier);
assert.equal(imageIssues.filter((entry) => entry.level === "error").length, 0);
const slideAssets = collectAssets(imageTestDossier).filter((asset) => asset.path.startsWith("dossier.slides"));
assert.equal(slideAssets.length, 3);
assert.equal(exampleDossier.theme.motif.kind, "asset");
assert.ok(exampleDossier.theme.motif.assets?.full.alt);
assert.ok(exampleDossier.theme.motif.assets?.quiet?.alt);
assert.equal(exampleDossier.theme.pageMarker?.kind, "rotating-asset");
assert.ok(exampleDossier.theme.backgrounds?.surface.alt);
assert.equal(exampleDossier.theme.chrome?.footer, "minimal");
const proofTrace = exampleDossier.slides.find((slide) => slide.id === "04-preuves");
assert.ok(proofTrace?.claims?.filter((claim) => claim.contentPath.startsWith("proofPoints"))
  .every((claim) => claim.kind === "interpretation" && claim.evidenceIds?.includes("fixture:narrative-plan")));
assert.ok(proofTrace?.claims?.some((claim) =>
  claim.contentPath === "image.credit"
  && claim.kind === "fact"
  && claim.evidenceIds?.includes("fixture:vector-assets"),
));
assert.ok(proofTrace?.claims?.every((claim) => claim.contentPath.length > 0));

const contentImageMarkup = renderToStaticMarkup(createElement(AssetImage, { asset: neutralProofImage }));
assert.ok(contentImageMarkup.includes(`alt="${neutralProofImage.alt}"`));
assert.ok(!contentImageMarkup.includes("aria-hidden"));
const decorativeImageMarkup = renderToStaticMarkup(createElement(AssetImage, {
  asset: neutralProofImage,
  decorative: true,
}));
assert.ok(decorativeImageMarkup.includes("aria-hidden=\"true\""));
assert.ok(decorativeImageMarkup.includes("alt=\"\""));
const appMarkup = renderToStaticMarkup(createElement(App, { dossier: imageTestDossier }));
assert.ok(appMarkup.includes("lang=\"fr-CH\""));
assert.ok(!appMarkup.includes("aria-label=\"Mots-clés\""));

const missingMotifFull: unknown = structuredClone(exampleDossier);
if (isRecord(missingMotifFull) && isRecord(missingMotifFull.theme) && isRecord(missingMotifFull.theme.motif)) {
  const assets = missingMotifFull.theme.motif.assets;
  if (isRecord(assets)) delete assets.full;
}
assert.ok(validateDossier(missingMotifFull).some((entry) => entry.code === "image-required"));
const qualitativeProof = imageTestDossier.slides.find((slide) => slide.type === "proof");
if (
  !qualitativeProof
  || qualitativeProof.type !== "proof"
  || !qualitativeProof.proofPoints
  || !qualitativeProof.image?.credit
) throw new Error("Fixture proof qualitative invalide.");
assert.ok(!("metrics" in qualitativeProof));
assert.equal(qualitativeProof.proofPoints.length, 3);
assert.ok(qualitativeProof.image.alt.length > 0);
assert.ok(qualitativeProof.image.credit.length > 0);

const withoutEvidence: unknown = structuredClone(imageTestDossier);
const proofWithoutEvidence = slideRecord(withoutEvidence, "proof");
if (proofWithoutEvidence) {
  delete proofWithoutEvidence.metrics;
  delete proofWithoutEvidence.proofPoints;
}
assert.ok(validateDossier(withoutEvidence).some((entry) => entry.code === "proof-evidence"));

const unsourcedMetrics: unknown = structuredClone(imageTestDossier);
const unsourcedProof = slideRecord(unsourcedMetrics, "proof");
if (unsourcedProof) {
  unsourcedProof.metrics = [
    { value: "1", label: "Valeur de test" },
    { value: "2", label: "Autre valeur de test" },
  ];
  delete unsourcedProof.proofPoints;
}
assert.ok(validateDossier(unsourcedMetrics).some((entry) => entry.code === "proof-source"));

const sourcedMetrics: unknown = structuredClone(unsourcedMetrics);
const sourcedProof = slideRecord(sourcedMetrics, "proof");
if (sourcedProof) {
  sourcedProof.evidenceIds = ["fixture:source-01"];
  sourcedProof.claims = [
    { text: "1 Valeur de test", kind: "fact", contentPath: "metrics[0]", evidenceIds: ["fixture:source-01"] },
    { text: "2 Autre valeur de test", kind: "fact", contentPath: "metrics[1]", evidenceIds: ["fixture:source-02"] },
  ];
}
if (isRecord(sourcedMetrics)) {
  sourcedMetrics.evidence = [
    { id: "fixture:source-01", kind: "fact", status: "verified", claim: "1 Valeur de test" },
    { id: "fixture:source-02", kind: "fact", status: "official-only", claim: "2 Autre valeur de test" },
  ];
}
const sourcedMetricIssues = validateDossier(sourcedMetrics);
assert.ok(!sourcedMetricIssues.some((entry) => entry.code === "proof-source"));
assert.ok(!sourcedMetricIssues.some((entry) => entry.code === "proof-claim"));

const unsourcedObservation: unknown = structuredClone(imageTestDossier);
const observedProof = slideRecord(unsourcedObservation, "proof");
if (observedProof) {
  observedProof.title = "Observation sans source";
  observedProof.claims = [
    { text: "Observation sans source", kind: "observation", contentPath: "title" },
  ];
}
assert.ok(validateDossier(unsourcedObservation).some((entry) => entry.code === "claim-source"));

const missingAlt: unknown = structuredClone(imageTestDossier);
const missingAltProof = slideRecord(missingAlt, "proof");
if (missingAltProof) {
  const proofImage = missingAltProof.image;
  if (isRecord(proofImage)) delete proofImage.alt;
}
assert.ok(validateDossier(missingAlt).some((entry) => entry.path.endsWith("image.alt")));

const remoteAsset: unknown = structuredClone(imageTestDossier);
const remoteProof = slideRecord(remoteAsset, "proof");
if (remoteProof && isRecord(remoteProof.image)) remoteProof.image.src = "https://example.com/proof.png";
assert.ok(validateDossier(remoteAsset).some((entry) =>
  entry.code === "remote-asset" && entry.level === "error",
));

const denseStoryboard = exampleDossier.slides.find((slide) => slide.id === "13-storyboard-serie");
assert.ok(denseStoryboard?.type === "storyboard");
assert.equal(denseStoryboard.frames.length, 10);
assert.equal(denseStoryboard.duration, "3 min 20 s");
assert.ok(denseStoryboard.frames.every((frame) => typeof frame.timecode === "string"));
assert.ok(denseStoryboard.frames.every((frame) => typeof frame.image?.src === "string"));

const missingFinalImage: unknown = structuredClone(exampleDossier);
const finalStoryboard = slideRecord(missingFinalImage, "storyboard");
if (finalStoryboard && Array.isArray(finalStoryboard.frames) && isRecord(finalStoryboard.frames[0])) {
  delete finalStoryboard.frames[0].image;
}
assert.ok(validateDossier(missingFinalImage).some((entry) => entry.code === "final-storyboard-image"));

const draftStoryboard = imageTestDossier.slides.find((slide) => slide.id === "test-storyboard-brouillon");
assert.ok(draftStoryboard?.type === "storyboard");
assert.ok(draftStoryboard.frames.every((frame) => !("image" in frame)));

const missingTimecode: unknown = structuredClone(exampleDossier);
if (isRecord(missingTimecode) && Array.isArray(missingTimecode.slides)) {
  const storyboard = missingTimecode.slides.find((slide) => isRecord(slide) && slide.id === "13-storyboard-serie");
  if (isRecord(storyboard) && Array.isArray(storyboard.frames) && isRecord(storyboard.frames[0])) {
    delete storyboard.frames[0].timecode;
  }
}
assert.ok(validateDossier(missingTimecode).some((entry) => entry.path.endsWith("frames[0].timecode")));

const tooManyFrames: unknown = structuredClone(exampleDossier);
if (isRecord(tooManyFrames) && Array.isArray(tooManyFrames.slides)) {
  const storyboard = tooManyFrames.slides.find((slide) => isRecord(slide) && slide.id === "13-storyboard-serie");
  if (isRecord(storyboard) && Array.isArray(storyboard.frames) && storyboard.frames[0] !== undefined) {
    while (storyboard.frames.length < 13) storyboard.frames.push(structuredClone(storyboard.frames[0]));
  }
}
assert.ok(validateDossier(tooManyFrames).some((entry) => entry.code === "array-size" && entry.path.endsWith("frames")));

const noContact = imageTestDossier.slides.find((slide) => slide.type === "thank-you");
assert.ok(noContact?.type === "thank-you" && !("contact" in noContact));

const silentLockup = imageTestDossier.slides.find((slide) => slide.type === "lockup");
assert.ok(silentLockup?.type === "lockup");
assert.ok(!("title" in silentLockup));
assert.ok(!("statement" in silentLockup));

const placement = fitWithinA4(2000, 1414);
assert.ok(Math.abs(placement.width / placement.height - 2000 / 1414) < 0.000001);
assert.ok(placement.x >= 0 && placement.y >= 0);

const pdfTestDirectory = await mkdtemp(resolve(".test-pdf-"));
try {
  const pngPath = join(pdfTestDirectory, "pixel.png");
  const secondPngPath = join(pdfTestDirectory, "pixel-second.png");
  const pdfPath = join(pdfTestDirectory, "test.pdf");
  const pixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const secondPixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlWl9sAAAAASUVORK5CYII=",
    "base64",
  );
  await writeFile(pngPath, pixelPng);
  await writeFile(secondPngPath, secondPixelPng);
  await createDossierPdf([secondPngPath, pngPath], pdfPath, imageTestDossier);
  const pdf = await PDFDocument.load(await readFile(pdfPath));
  assert.equal(pdf.getPageCount(), 2);
  assert.equal(pdf.getAuthor(), undefined);
  const firstHash = pdf.getPage(0).node.get(PDFName.of("DossierSourceSHA256"));
  const secondHash = pdf.getPage(1).node.get(PDFName.of("DossierSourceSHA256"));
  const firstFile = pdf.getPage(0).node.get(PDFName.of("DossierSourceFile"));
  assert.ok(firstHash instanceof PDFString);
  assert.ok(secondHash instanceof PDFString);
  assert.ok(firstFile instanceof PDFString);
  assert.equal(firstHash.decodeText(), createHash("sha256").update(secondPixelPng).digest("hex"));
  assert.equal(secondHash.decodeText(), createHash("sha256").update(pixelPng).digest("hex"));
  assert.equal(firstFile.decodeText(), "pixel-second.png");
  assert.notEqual(firstHash.decodeText(), secondHash.decodeText());
  assert.ok(Math.abs(pdf.getPage(0).getWidth() - A4_LANDSCAPE.width) < 0.01);
  assert.ok(Math.abs(pdf.getPage(0).getHeight() - A4_LANDSCAPE.height) < 0.01);
} finally {
  await rm(pdfTestDirectory, { force: true, recursive: true });
}

console.log("Tests: schéma, images, preuve sourcée, storyboard, fins optionnelles et PDF A4 validés.");
