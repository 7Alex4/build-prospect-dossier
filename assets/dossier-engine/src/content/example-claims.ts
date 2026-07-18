import { substantiveContentEntries } from "../schema/content-claims";
import type { ClaimKind, ClaimRef, DossierSlide } from "../schema/types";

type ClaimSpec = readonly [contentPath: string, kind: ClaimKind, evidenceIds?: readonly string[]];

const proposal = (contentPath: string): ClaimSpec => [contentPath, "proposal"];
const interpretation = (contentPath: string): ClaimSpec => [contentPath, "interpretation"];
const observed = (contentPath: string): ClaimSpec => [contentPath, "observation", ["fixture:context-audit"]];
const assetFact = (contentPath: string): ClaimSpec => [contentPath, "fact", ["fixture:vector-assets"]];
const contactFact = (contentPath: string): ClaimSpec => [contentPath, "fact", ["fixture:contact-card"]];

const specs: Readonly<Record<string, readonly ClaimSpec[]>> = {
  "01-ouverture": [
    proposal("title"), proposal("subtitle"), proposal("proposition"),
  ],
  "02-architecture": [
    proposal("title"), proposal("statement"), proposal("nodes[0].label"),
    proposal("nodes[0].detail"), proposal("nodes[1].label"), proposal("nodes[1].detail"),
    proposal("nodes[2].label"), proposal("nodes[2].detail"), proposal("nodes[3].label"),
    proposal("nodes[3].detail"), proposal("axisLabel"), assetFact("image.credit"),
  ],
  "03-pourquoi-maintenant": [
    observed("title"), observed("intro"), observed("columns[0].title"),
    observed("columns[0].body"), observed("columns[1].title"), observed("columns[1].body"),
    observed("columns[2].title"), observed("columns[2].body"), interpretation("conclusion"),
  ],
  "04-preuves": [
    proposal("title"), proposal("proofPoints[0]"), proposal("proofPoints[1]"),
    proposal("proofPoints[2]"), assetFact("image.credit"),
  ],
  "05-manifeste": [
    proposal("title"), proposal("lines[0]"), proposal("lines[1]"), proposal("lines[2]"),
    proposal("lines[3]"), proposal("closing"),
  ],
  "06-risque": [
    interpretation("title"), interpretation("lead"), interpretation("risks[0].label"),
    interpretation("risks[0].consequence"), interpretation("risks[1].label"),
    interpretation("risks[1].consequence"), interpretation("risks[2].label"),
    interpretation("risks[2].consequence"), proposal("counterpoint"), assetFact("image.credit"),
  ],
  "07-basculements": [
    proposal("title"), interpretation("shifts[0].from"), proposal("shifts[0].to"),
    proposal("shifts[0].implication"), interpretation("shifts[1].from"), proposal("shifts[1].to"),
    proposal("shifts[1].implication"), interpretation("shifts[2].from"), proposal("shifts[2].to"),
    proposal("shifts[2].implication"),
  ],
  "08-systeme": [
    proposal("title"), proposal("core.label"), proposal("core.detail"), proposal("layers[0].label"),
    proposal("layers[0].detail"), proposal("layers[1].label"), proposal("layers[1].detail"),
    proposal("layers[2].label"), proposal("layers[2].detail"), proposal("layers[3].label"),
    proposal("layers[3].detail"), proposal("outcomes[0]"), proposal("outcomes[1]"),
    proposal("outcomes[2]"),
  ],
  "09-methode": [
    proposal("title"), proposal("steps[0].duration"), proposal("steps[0].title"),
    proposal("steps[0].detail"), proposal("steps[0].deliverable"), proposal("steps[1].duration"),
    proposal("steps[1].title"), proposal("steps[1].detail"), proposal("steps[1].deliverable"),
    proposal("steps[2].duration"), proposal("steps[2].title"), proposal("steps[2].detail"),
    proposal("steps[2].deliverable"), proposal("steps[3].duration"), proposal("steps[3].title"),
    proposal("steps[3].detail"), proposal("steps[3].deliverable"),
  ],
  "10-film-hero": [
    proposal("title"), proposal("conceptName"), proposal("logline"), proposal("format"),
    proposal("duration"), proposal("toneWords[0]"), proposal("toneWords[1]"),
    proposal("toneWords[2]"), proposal("toneWords[3]"), assetFact("image.credit"),
  ],
  "11-storyboard-hero": [
    proposal("title"), proposal("frames[0].beat"), proposal("frames[0].visual"),
    proposal("frames[0].onScreen"), proposal("frames[0].audio"), assetFact("frames[0].image.credit"),
    proposal("frames[1].beat"), proposal("frames[1].visual"), proposal("frames[1].audio"),
    assetFact("frames[1].image.credit"), proposal("frames[2].beat"), proposal("frames[2].visual"),
    proposal("frames[2].onScreen"), assetFact("frames[2].image.credit"), proposal("frames[3].beat"),
    proposal("frames[3].visual"), proposal("frames[3].audio"), assetFact("frames[3].image.credit"),
  ],
  "12-film-serie": [
    proposal("title"), proposal("conceptName"), proposal("logline"), proposal("format"),
    proposal("duration"), proposal("toneWords[0]"), proposal("toneWords[1]"),
    proposal("toneWords[2]"), proposal("toneWords[3]"), assetFact("image.credit"),
  ],
  "13-storyboard-serie": [
    proposal("title"), proposal("duration"), proposal("frames[0].beat"), proposal("frames[0].visual"),
    proposal("frames[0].onScreen"), assetFact("frames[0].image.credit"), proposal("frames[1].beat"),
    proposal("frames[1].visual"), proposal("frames[1].audio"), assetFact("frames[1].image.credit"),
    proposal("frames[2].beat"), proposal("frames[2].visual"), proposal("frames[2].onScreen"),
    assetFact("frames[2].image.credit"), proposal("frames[3].beat"), proposal("frames[3].visual"),
    proposal("frames[3].audio"), assetFact("frames[3].image.credit"), proposal("frames[4].beat"),
    proposal("frames[4].visual"), assetFact("frames[4].image.credit"), proposal("frames[5].beat"),
    proposal("frames[5].visual"), assetFact("frames[5].image.credit"), proposal("frames[6].beat"),
    proposal("frames[6].visual"), assetFact("frames[6].image.credit"), proposal("frames[7].beat"),
    proposal("frames[7].visual"), assetFact("frames[7].image.credit"), proposal("frames[8].beat"),
    proposal("frames[8].visual"), assetFact("frames[8].image.credit"), proposal("frames[9].beat"),
    proposal("frames[9].visual"), assetFact("frames[9].image.credit"),
  ],
  "14-activation": [
    proposal("title"), proposal("lead"), proposal("channels[0].name"), proposal("channels[0].role"),
    proposal("channels[0].asset"), proposal("channels[1].name"), proposal("channels[1].role"),
    proposal("channels[1].asset"), proposal("channels[2].name"), proposal("channels[2].role"),
    proposal("channels[2].asset"), proposal("channels[3].name"), proposal("channels[3].role"),
    proposal("channels[3].asset"), proposal("sequence[0]"), proposal("sequence[1]"),
    proposal("sequence[2]"), proposal("sequence[3]"),
  ],
  "15-production": [
    proposal("title"), proposal("lead"), proposal("workstreams[0].name"),
    proposal("workstreams[0].detail"), proposal("workstreams[0].owner"),
    proposal("workstreams[1].name"), proposal("workstreams[1].detail"),
    proposal("workstreams[1].owner"), proposal("workstreams[2].name"),
    proposal("workstreams[2].detail"), proposal("workstreams[2].owner"),
    proposal("deliverables[0]"), proposal("deliverables[1]"), proposal("deliverables[2]"),
    proposal("deliverables[3]"), proposal("deliverables[4]"), proposal("constraints[0]"),
    proposal("constraints[1]"), proposal("constraints[2]"), assetFact("image.credit"),
  ],
  "16-references": [
    proposal("title"), proposal("references[0].title"), proposal("references[0].reason"),
    proposal("references[0].source"), proposal("references[1].title"), proposal("references[1].reason"),
    proposal("references[1].source"), proposal("references[2].title"), proposal("references[2].reason"),
    proposal("references[2].source"), proposal("references[3].title"), proposal("references[3].reason"),
    proposal("references[3].source"), proposal("note"),
  ],
  "17-merci": [
    proposal("title"), proposal("message"), contactFact("contact.name"),
    contactFact("contact.role"), contactFact("contact.email"), contactFact("contact.website"),
    proposal("nextStep"),
  ],
  "18-signature": [proposal("title"), proposal("statement")],
};

function claimText(value: string | { value: string; label: string }): string {
  return typeof value === "string" ? value : `${value.value} ${value.label}`;
}

export function withExampleClaims<T extends DossierSlide>(slide: T): T & { claims: readonly ClaimRef[] } {
  const slideSpecs = specs[slide.id];
  if (!slideSpecs) throw new Error(`Claims explicites absents pour ${slide.id}.`);
  const content = new Map(substantiveContentEntries(slide).map((entry) => [entry.path, entry.value]));
  const declared = new Set(slideSpecs.map(([path]) => path));
  const missing = [...content.keys()].filter((path) => !declared.has(path));
  const unknown = [...declared].filter((path) => !content.has(path));
  if (missing.length > 0 || unknown.length > 0 || declared.size !== slideSpecs.length) {
    throw new Error(`Cartographie de claims invalide pour ${slide.id}.`);
  }
  const claims = slideSpecs.map(([contentPath, kind, evidenceIds]): ClaimRef => ({
    contentPath,
    kind,
    text: claimText(content.get(contentPath) as string | { value: string; label: string }),
    ...(evidenceIds ? { evidenceIds } : {}),
  }));
  return { ...slide, claims };
}
