# Black Flower Prospect Dossier Framework

[![CI](https://github.com/7Alex4/build-prospect-dossier/actions/workflows/ci.yml/badge.svg)](https://github.com/7Alex4/build-prospect-dossier/actions/workflows/ci.yml)

An open-source Black Flower framework and strict TypeScript production engine for evidence-led, image-first premium prospecting dossiers.

Give Codex a company name and, optionally, an angle or film ideas. The skill researches the company, separates facts from proposals, casts meaningful real and authorized generated imagery, builds the Black Flower narrative, renders numbered PNG pages and an A4 landscape PDF, then audits the complete delivery.

The final Black Flower output is 15 to 20 pages at 2000 x 1414 px.

## What it produces

- a resolved brief and evidence register;
- an explicit claim map for every substantive visible field;
- a rights-aware asset ledger;
- an explicit visual-intent and image-cadence plan;
- a strategic platform and page-by-page narrative;
- local, editable strict TypeScript source;
- numbered opaque sRGB PNG pages;
- an A4 landscape PDF;
- `render-report.json` with evidence, asset and source traceability, plus mandatory `render-report.sha256`;
- a contact sheet and machine-readable audit report.

## Core principles

- Never invent company facts, dates, quotes, awards, capabilities or relationships.
- Distinguish facts, observations, interpretations and creative proposals.
- Treat official or provided media as origin information, not automatic permission.
- Block unregistered, uncleared or scope-incompatible assets.
- Keep 45–65% of pages image-led, target 55%, with at least 60% real or documentary visual pages and no more than 40% generated visual pages.
- Use no more than two true diagrams and never hide missing imagery behind cards, nodes, arrows or abstract geometry.
- Use authorized generated imagery for creative projection only, never as product, person, archive or company evidence.
- Keep `Black Flower Creative House` as canonical author and `BlackFlower` as the visible signature. Nexaia is the technical maintainer, not the rendered author.
- Use one dominant idea per page and maintain a controlled density rhythm.
- Require a complete final render. A draft or selected-page render cannot pass delivery audit.
- Keep private source forensics and third-party assets outside the public skill.

## Install

Ask Codex to install this repository as the `build-prospect-dossier` skill, or clone it into your Codex skills directory:

```bash
git clone https://github.com/7Alex4/build-prospect-dossier.git \
  "$CODEX_HOME/skills/build-prospect-dossier"
```

If `CODEX_HOME` is not configured, the usual personal location is `~/.codex/skills/build-prospect-dossier`.

## Use

Minimal prompt:

```text
Use $build-prospect-dossier to create a complete prospecting dossier for COMPANY.
```

Neutral or external use with a fixed angle:

```text
Use $build-prospect-dossier for COMPANY.
Use the neutral profile.
The angle is "ANGLE" and must remain fixed.
Generative imagery is forbidden.
Produce the complete PNG, PDF and editable-source delivery.
```

The skill begins without blocking questions when a company name is sufficient. It records missing information as assumptions or research tasks instead of inventing answers.

Black Flower default for Alex:

```text
Use $build-prospect-dossier for COMPANY with the Black Flower profile.
The angle is "ANGLE".
Use meaningful official, documentary and licensed images. Alex Houser authorizes generated campaign scenes and storyboards under reference black-flower-owner-brief-2026-07-18#visuals, but never as evidence.
Produce the complete PNG, PDF and editable-source delivery.
```

## Repository structure

| Path | Purpose |
|---|---|
| `SKILL.md` | Core agent contract and end-to-end workflow |
| `references/` | Research, strategy, narrative, copy, visual direction, production and QA manuals |
| `assets/dossier-engine/` | React and strict TypeScript renderer, validators and neutral fixture |
| `scripts/` | Source audit, logo preparation, project scaffolding and output audit tools |
| `agents/openai.yaml` | Codex skill interface metadata |

## Start a dossier project

Requirements:

- Node.js 20.19 or newer;
- pnpm through Corepack;
- Chromium for Playwright rendering;
- Poppler tools `pdfinfo` and `pdftoppm` for final PDF audit;
- locally licensed fonts and approved local assets for production work.

Initialize a clean project from the bundled engine:

```bash
cd scripts
corepack pnpm install --frozen-lockfile
node dist/init-project.js /absolute/path/to/new-dossier
```

The public initializer defaults to the `neutral` profile so it never attributes outside work to Black Flower. For an authorized Black Flower job, select the profile explicitly:

```bash
node dist/init-project.js /absolute/path/to/new-dossier --profile black-flower
```

The scaffold includes the brief, evidence register, claim map, asset ledger, research notes, strategy documents, source folders, output folders and a QA report.

Generated imagery is forbidden by default. Explicit authorization must name both the authorizer and a durable brief reference:

```bash
node dist/init-project.js /absolute/path/to/new-dossier \
  --profile black-flower \
  --authorize-generative-assets "brief#visuals" \
  --generative-assets-authorized-by "Authorizer name"
```

Selecting `black-flower` does not grant that authorization. The owner workflow records Alex's standing brief explicitly; every other user supplies their own authorizer and reference.

## Quality gates

The engine validates:

- stable ASCII kebab-case slide IDs;
- exact claim-to-visible-field mappings;
- verified or official-only evidence for factual claims;
- explicit independent, approved or commissioned relationship labels on the cover and in metadata, with a silent final co-mark;
- safe contact links;
- placeholder and forbidden-term scans across visible content and theme strings;
- local storyboard imagery in final mode;
- typed asset rights, origins and distribution scopes;
- bounded image hydration and reuse;
- final versus draft render semantics.
- a complete 15 to 20-page Black Flower narrative in the required order;
- a grounded mix of facts, observations and sourced interpretations;
- Black Flower authorship and running-header identity;
- 45–65% image-led cadence, real-asset share and generated-asset ceiling;
- maximum diagram count and maximum text/system run;
- type-compatible composition families, no adjacent repetition and three uses maximum per family;
- mandatory media on risk, route, priority activation, storyboard and production pages;
- measured fixed masters for Production, Merci and the silent final co-mark;
- portrait source-ratio and subject-safe-box validation;
- declared `stable` or `binary-chapter` background rhythm, with transition limits;
- rejection of generic foreground substitutes, typed-logo fallbacks and non-Black-Flower final marks; a documented prospect-derived cover motif may remain in the background.

The output auditor validates:

- contiguous page numbering;
- 2000 x 1414 opaque sRGB PNG pages;
- A4 landscape PDF geometry and page count;
- PDF page order and source hashes;
- real Poppler raster comparison between PDF pages and ordered PNGs;
- a full final `render-report.json` with no selection applied and a matching `render-report.sha256` sidecar;
- SHA-256 binding across source, hydrated assets, PNG pages, PDF and render report;
- a hashed font contract with Chromium-resolved family, weight, PostScript name, licence and source identity;
- absence of external browser requests and `internal-only` evidence leakage.

## Development checks

Utility tools:

```bash
cd scripts
corepack pnpm install --frozen-lockfile
corepack pnpm check
```

Renderer:

```bash
cd assets/dossier-engine
corepack pnpm install --frozen-lockfile
corepack pnpm check
corepack pnpm validate src/content/example.ts
```

`pnpm check` covers strict type-checking, validation tests, library and application builds, and a strict NodeNext package-consumer contract.

## Publication boundary

This repository contains an original Black Flower method, a neutral compatibility profile, redistributable fixtures and reusable code. It contains no real prospect dossier, prospect copy, third-party photograph, proprietary font, private Black Flower logo or private source analysis. A new prospect job must acquire and document its own current evidence, permissions and assets.

The neutral fixture exists to test schemas, rendering and packaging. It is not an aesthetic reference. The Black Flower profile requires prospect-specific real or documentary imagery before a final dossier can pass.

See `NOTICE` for the complete boundary.

## Known limitation

The delivered PDF intentionally embeds the audited PNG pages. It is visually deterministic, but its text is not selectable and the PDF is not tagged for screen readers. The numbered PNGs and editable source remain part of the complete delivery.

## License

MIT. See `LICENSE`.
