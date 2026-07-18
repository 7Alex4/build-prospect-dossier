# Production Workflow

## Purpose

Turn the researched page map into an editable, deterministic dossier project. The production system must create the same ordered 2000 × 1414 px PNG pages, matching PDF and audit report from the same content source.

Do not begin implementation before the brief, evidence ledger, claim map, asset ledger, retained platform and page map exist.

## Table of contents

1. Initialize a job
2. Install the engine
3. Audit supplied sources
4. Prepare logo variants
5. Separate content and presentation
6. Map page roles to component families
7. Resolve local assets
8. Preview
9. Run technical gates
10. Enforce the output contract
11. Audit the rendered package
12. Preserve determinism
13. Recover from failures
14. Package the delivery

## Included toolchain

The skill contains two independent TypeScript packages:

```text
assets/dossier-engine/   React renderer, preview, validation and export
scripts/                 project scaffold, source audit, logo preparation and output audit
```

The engine is copied into each prospect job. The utilities stay in the skill and operate on explicit input and output paths. The utility package is skill-local and intentionally not publishable as a standalone npm package because `init-project` resolves the sibling engine template. When invoking it from another location, pass an explicit `--template` path.

Required local tools:

- Node.js 20.19.0 or newer;
- Corepack and pnpm;
- Chromium installed through Playwright;
- Poppler with both `pdfinfo` and `pdftoppm` on `PATH`;
- licensed local font files selected for this job, plus the local images needed by the job;
- when the deck contains a QR code, ZBar `zbarimg` on `PATH`, or a named manual scanner recorded in QA as the explicit fallback.

Never add a client asset, paid font, research capture or rendered prospect dossier to the reusable skill package.

## 1. Initialize a job

Set task-specific paths. Do not rely on the current directory:

```bash
PROSPECT_SKILL_DIR="/absolute/path/to/build-prospect-dossier"
DOSSIER_JOB_DIR="/absolute/path/to/company-dossier"
```

Install the utility package once:

```bash
corepack pnpm --dir "$PROSPECT_SKILL_DIR/scripts" install --frozen-lockfile
```

Create a job with the scaffold command documented by `--help`:

```bash
corepack pnpm --dir "$PROSPECT_SKILL_DIR/scripts" init-project -- "$DOSSIER_JOB_DIR"
```

The initializer must refuse a non-empty destination. Do not use `--force` unless overwriting that exact destination is explicitly intended and its contents have been inspected.

If the initializer is unavailable, copy `assets/dossier-engine/` into the job and create this structure manually:

```text
company-dossier/
├── brief.yaml
├── research/
│   ├── evidence.csv
│   ├── claim-map.csv
│   ├── observations.md
│   └── source-notes.md
├── assets/
│   ├── raw/
│   ├── processed/
│   └── asset-ledger.csv
├── strategy/
│   ├── diagnosis.md
│   ├── platform.md
│   └── page-map.md
├── src/
│   └── content/
│       ├── brand.ts
│       └── deck.ts
├── qa/
│   └── report.md
└── output/
    └── slides/
```

Do not copy generated directories such as `node_modules/`, `dist/`, `rendered/`, browser caches or previous output.

Set `distribution_mode` and `relationship_status` in `brief.yaml` before asset selection. They control which assets may ship and how the cover and final marks are attributed.

## 2. Install the engine

From the new job:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm exec playwright install chromium
```

Keep the committed lockfile. Do not silently upgrade dependencies during a client job.

## 3. Audit all supplied sources

Place untouched source material in `assets/raw/`. Keep filenames stable until the manifest is written.

For a source PDF, preserve the original and inspect its metadata before rasterization:

```bash
pdfinfo "$DOSSIER_JOB_DIR/assets/raw/source-dossier.pdf"
mkdir -p "$DOSSIER_JOB_DIR/assets/raw/source-pages"
pdftoppm -png -scale-to-x 2000 -scale-to-y -1 \
  "$DOSSIER_JOB_DIR/assets/raw/source-dossier.pdf" \
  "$DOSSIER_JOB_DIR/assets/raw/source-pages/page"
```

Use the rendered pages for visual forensics, not as editable source. If Poppler is unavailable, install it before claiming the PDF was inspected page by page. For Canva PNG or JPEG exports, preserve the original order and filenames; do not recompress them before audit.

Run the source audit:

```bash
corepack pnpm --dir "$PROSPECT_SKILL_DIR/scripts" source-audit -- \
  "$DOSSIER_JOB_DIR/assets/raw" \
  --out "$DOSSIER_JOB_DIR/qa/source-audit"
```

The audit must produce:

- a naturally sorted inventory;
- dimensions, aspect ratio and byte size;
- SHA-256 fingerprints;
- representative palette values where supported;
- `manifest.json` and `manifest.md`;
- a contact sheet for visual inspection.

Use the audit to detect missing pages, duplicate exports, mixed dimensions, unexpectedly small images and source changes. It does not establish copyright or permission. Record rights separately in `assets/asset-ledger.csv`.

## 4. Prepare logo variants

Keep the original logo untouched. Prefer official SVG. Create light and dark transparent PNGs for layout use:

```bash
corepack pnpm --dir "$PROSPECT_SKILL_DIR/scripts" prepare-logo -- \
  "$DOSSIER_JOB_DIR/assets/raw/client-logo.svg" \
  --out "$DOSSIER_JOB_DIR/assets/processed/client-logo"
```

Required behavior:

- preserve aspect ratio;
- trim only transparent excess;
- add consistent optical padding;
- keep alpha transparency;
- emit light and dark monochrome variants;
- record input, output, dimensions and transformations in a report;
- fail on an opaque raster instead of guessing its background.

For an opaque raster, inspect the pixels first and pass an explicit matte only when the background is truly uniform and removable:

```bash
corepack pnpm --dir "$PROSPECT_SKILL_DIR/scripts" prepare-logo -- \
  "$DOSSIER_JOB_DIR/assets/raw/client-logo.png" \
  --out "$DOSSIER_JOB_DIR/assets/processed/client-logo" \
  --matte white
```

Visually inspect alpha edges on both a dark and light field. Never trace, redraw or stretch the mark automatically.

## 5. Separate content from presentation

The dossier is a typed object satisfying `Dossier`. Keep factual and editorial content in `src/content/`; keep composition behavior in components and CSS.

The content has four levels:

1. `meta`: client, optional studio, language, version, date, distribution, relationship, generative-asset policy and required `stage`;
2. `evidence`: typed registry of evidence IDs, classes and usable statuses;
3. `theme`: palette, typography, logo, motif and marker behavior;
4. `slides`: ordered discriminated union of page families, including typed claim metadata.

Start from the neutral example only for syntax. Replace every example value. Do not retain the fictional client, platform, facts, IDs or accents.

Recommended split:

```text
src/content/
├── brand.ts        theme, logo and motif tokens
├── evidence.ts     typed client-facing claims if useful
└── deck.ts         ordered slide definitions
```

Use `satisfies Dossier` so literals retain useful inference while the complete contract is checked. Mirror every client-facing claim in `research/claim-map.csv`; factual, quoted and observational claims require evidence IDs in both the typed slide metadata and the CSV. Every referenced ID must exist in the typed evidence registry with a usable status. Interpretations may derive from facts or observations; proposals may cite evidence without pretending to be facts.

### Stage and claim contract

Use `meta.stage: "draft"` while copy, evidence or storyboard images are incomplete. Draft mode validates every claim that exists, but it does not require complete claim coverage and it permits storyboard frames without images. Change the value to `meta.stage: "final"` before the final validation, full render, independent audit and delivery.

Every `ClaimRef.contentPath` is relative to its own slide:

- valid: `title`, `columns[0].body`, `metrics[0]`, `frames[2].onScreen`;
- invalid: `slides[0].title`, `slides.3.metrics.0`, an ID field, asset URL or other technical metadata.

The path must resolve to a client-visible claim target. `ClaimRef.text` must match that target after Unicode, case and whitespace normalization. A claim pointing to `metrics[0]` must contain both the metric value and label. In final mode, every substantive visible field requires at least one valid resolving claim.

Assign `fact`, `quote`, `observation`, `interpretation` or `proposal` field by field. Never create a general helper that marks every visible field as `proposal` to satisfy coverage. Proposal status is a semantic assertion, not a fallback.

Studio identity is optional. If it is absent, omit the studio mark, signature and empty layout slot. An `independent-proposal` still requires explicit cover and lockup wording such as `Proposition indépendante pour [prospect]`. When a studio is supplied, the same label must also name it.

### Input trust boundary

The engine imports `.ts` and `.js` content files as executable modules. Load only project-local files that were created or audited for this job. Never import a downloaded, user-uploaded or otherwise untrusted script. Transcribe untrusted structured content to JSON, inspect it as data, then validate the JSON input instead.

### Theme contract

The engine supports a measured prospect-specific grammar:

- six semantic color roles and three typography roles;
- optional local background assets per tone, with colors as deterministic fallback;
- built-in neutral motifs for scaffolding only;
- an `asset` motif with separate full and quiet prepared files, stable placement and per-slide `default`, `full`, `quiet` or `hidden` state;
- optional running header;
- minimal or fuller footer behavior;
- numeric, absent or rotating-asset page marker with deterministic angle progression;
- optional per-slide chapter mark.

Use the asset motif, backgrounds and marker only when they derive from real prospect evidence. The built-in frame, orbit, grid and signal motifs are neutral development fixtures, not default art direction for a client dossier.

## 6. Map page roles to component families

Choose a family from its rhetorical function, not its appearance.

| Family | Use |
|---|---|
| `cover` | central proposition and opening contract |
| `architecture` | dossier route or argument map |
| `three-columns` | three-part diagnosis, pillars or why-now |
| `manifesto` | condensed conviction or platform language |
| `proof` | evidence, observable signals, verified metrics or quote |
| `risk` | gap, risk or false binary |
| `opportunity` | shift from present perception to desired meaning |
| `platform` | central territory and its operating dimensions |
| `timeline` | sequence, roadmap or method |
| `film-concept` | one activation idea with logline, duration and tone |
| `activation` | channel system, roles, assets and sequence |
| `storyboard` | 3 to 12 inspectable frames with timing where duration is fixed; every final frame has a local image |
| `production` | production logic, deliverables and constraints |
| `references` | verified, linked and relevant precedent evidence |
| `thank-you` | recap, invitation and optional contact |
| `lockup` | silent close with truthful prospect attribution and optional studio attribution |

If no family matches the rhetorical job, create a new typed family. Do not force content into a near match merely to avoid implementation work.

When adding a family:

1. add its interface to the discriminated union;
2. add focused validation and content budgets;
3. build one named functional component;
4. add explicit CSS states and responsive preview behavior;
5. route it in `SlideRenderer`;
6. add a neutral fixture and structural test;
7. document its intended use and rejection cases.

Keep every source file below 300 lines. Split by responsibility before it reaches the limit.

Every slide `id` must be unique ASCII kebab-case, such as `01-cover`. IDs that normalize to the same output name are rejected. A slide ID is technical metadata and must never be used as automatic footer copy.

## 7. Resolve local assets deterministically

Image sources are resolved relative to the content file. Prefer project-relative paths. Absolute paths may work locally but break a shared repository.

An image asset must include useful alternative text and may define:

- `id`: required stable ID matching the typed root asset registry;
- `fit`: crop behavior;
- `position`: focal point;
- `treatment`: natural, monochrome or duotone;
- `credit`: visible credit when required;
- a local `src` backed by an approved asset-ledger row.

Mirror the job ledger in the typed root `assets` registry. Each record requires a unique `id`, either an exact `src` or a `ledgerId`, an enumerated origin, a nonempty `rightsBasis`, a rights `status` and `allowedDistributionScopes`. Map the files as follows:

| `asset-ledger.csv` | Typed registry |
|---|---|
| `id` | `id` |
| `file` | `src`, resolved relative to the content file |
| external ledger row identity | `ledgerId`, when `src` is intentionally omitted from the registry |
| `origin` | `origin` |
| `rights_basis` | `rightsBasis` |
| `status` | `status` |
| `distribution_scope` | `allowedDistributionScopes` |

Only `status: "approved"` is shippable. Every used asset must include the active `meta.distributionMode` in `allowedDistributionScopes`. An origin of `generated` also requires `meta.generativeAssets: "authorized"`. The validator traverses slide images, storyboard frames, references, logos, motifs, page markers and theme backgrounds. It rejects missing IDs, unknown registry IDs, mismatched sources, uncleared rights and incompatible scopes.

Do not write `slide.assetIds`. This field is rejected because it can drift. The renderer derives slide and theme asset IDs from the `ImageAsset` objects actually traversed.

Remote HTTP assets are errors during validation and are also rejected during rendering. Download lawful source files, preserve their originals, record provenance, prepare them locally and render from stable files.

Hydration defaults to 32 MiB per unique asset and 256 MiB cumulatively. Identical local sources are read once. Data URIs count against the same budgets, and unused registry rows are not loaded. Oversized input is a validation or preparation problem, not a reason to raise the limits silently.

In `final` mode, each storyboard frame must reference an approved local file or a local `data:image/...` value. Missing frames and remote URLs are final-gate failures. Draft-only frame treatments must never survive the final render.

Do not use an untyped CSS background image for material evidence. Use typed image objects so loading, alt text and broken-file checks remain visible to validation. Theme background assets may supply paper or field texture, but they must not hide a product, person, place or screenshot that carries a claim.

## 8. Preview during implementation

Run the local preview with the actual dossier input:

```bash
corepack pnpm preview src/content/deck.ts
```

The command validates and hydrates local assets before starting Vite, then prints the local URL. Relaunch it after changing the content file so the typed data is reinjected. CSS retains Vite hot reload.

The browser view scales the fixed 2000 × 1414 canvas. Inspect at both:

- 375 px viewport width;
- 1440 px viewport width.

There must be no horizontal page clipping, unexpected browser overflow or essential UI hidden at either width. The exported slide remains fixed-size; only the preview shell responds.

Check `prefers-reduced-motion`. Any preview transition must become static or near-static when reduction is requested. The dossier itself should not depend on motion.

## 9. Run the technical gates

Use the exact sequence below after every material content or layout change:

```bash
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
corepack pnpm validate src/content/deck.ts
corepack pnpm render src/content/deck.ts --out output
```

The first three commands may run while the dossier is still a draft. Before the final `validate` and `render`, set `meta.stage` to `final`. Do not switch it back to `draft` to bypass a failed final gate.

The validator checks the typed content contract, slide IDs, supported variants, item counts, text budgets, local files and asset sources.

It also checks stage, optional-studio relationship wording, contact email syntax, HTTP(S) website URLs, safe telephone links, the evidence registry, claim-to-evidence compatibility, exact relative claim targets, final substantive coverage, visible/accessibility/theme text scans, the typed asset registry and rights scopes, reference sources, storyboard timing, one local image per final frame and HTTP asset rejection.

The renderer adds browser-level checks:

- fonts loaded before capture;
- images decoded successfully;
- no browser console errors;
- no marked content overflow;
- exact PNG dimensions;
- deterministic page order;
- PDF created from the same PNG sequence.

Without a content argument, the commands use the neutral example. Never confuse a passing example build with validation of the client deck.

Render a subset while correcting a page:

```bash
corepack pnpm render src/content/deck.ts \
  --out output/review \
  --slides 1,08-platform,18
```

Run the full render again before delivery.

## 10. Output contract

The renderer creates:

```text
output/
├── dossier.pdf
├── render-report.json
└── slides/
    ├── 01-cover.png
    ├── 02-architecture.png
    └── ...
```

Requirements:

- slide numbers begin at `01` and are contiguous;
- filenames use zero-padded natural order and stable slide IDs;
- every PNG is exactly 2000 × 1414 px;
- PDF order and page count match the PNG sequence;
- every PDF page carries `DossierSourceFile` and `DossierSourceSHA256` markers matching the ordered PNG that was embedded;
- PDF MediaBox is A4 landscape, 841.89 × 595.28 pt, with the PNG fitted without distortion;
- no stale PNG from a previous longer deck remains in the delivery directory;
- `render-report.json` records the input and checks performed;
- `render-report.json` uses `schemaVersion: "1.0"` and records root `stage`, `totalSlides`, `renderedCount`, `selectionApplied`, exact CLI `selection` values and ordered `renderedSlideIds`;
- `render-report.json` derives `themeAssetIds` and `traceability[].assetIds` from traversed images, never from a manual declaration;
- `render-report.json` summarizes used registry rows without copying raw local paths or data URIs; `assetRegistry[].sourceIdentity` contains only a kind and SHA-256;
- each `traceability[].evidenceIds` is the deduplicated union of slide-level evidence and evidence cited by its detailed `claims`;
- a delivery report must have `stage: "final"`, `selectionApplied: false`, an empty `selection`, and `renderedCount === totalSlides === renderedSlideIds.length`;

Use a fresh output directory or inspect and deliberately clear the exact old output directory before a final render.

## 11. Audit the rendered package

Run the independent output audit after rendering:

When `pdftoppm` is not on `PATH`, set `PDFTOPPM_PATH` to its absolute executable path for this command. The audit fails closed when the renderer is unavailable.

```bash
corepack pnpm --dir "$PROSPECT_SKILL_DIR/scripts" audit-output -- \
  "$DOSSIER_JOB_DIR/output/slides" \
  --pdf "$DOSSIER_JOB_DIR/output/dossier.pdf" \
  --out "$DOSSIER_JOB_DIR/qa/output-audit"
```

The audit must independently verify:

- contiguous natural numbering;
- page count;
- exact PNG dimensions;
- nonempty and decodable files;
- PDF page count;
- PDF MediaBox and landscape orientation;
- per-page embedded filename, SHA-256 linkage and order against the final PNG sequence;
- real rasterized PDF page content against the corresponding final PNG, using Poppler `pdftoppm`, independently of the embedded markers;
- a regenerated contact sheet;
- a machine-readable `audit.json`;
- nonzero exit status for a hard failure.

Open the contact sheet. Then open every full-resolution page. An automated audit cannot judge weak hierarchy, a poor crop, semantic accent misuse, image irrelevance, an unconvincing route or a flat ending.

Copy the final audited contact sheet to `output/contact-sheet.png`. The copy in `qa/output-audit/` is audit evidence; the copy in `output/` is the delivery artifact.

If a page contains a QR code, decode it from the final 2000 × 1414 PNG with ZBar and compare the resolved destination to the visible label:

```bash
zbarimg --quiet --raw "$DOSSIER_JOB_DIR/output/slides/NN-page.png"
```

Record page, decoder, decoded value, expected value and result in `qa/qr-audit.csv`. If `zbarimg` is unavailable, record that absence, name the trusted camera or scanner application chosen as fallback, scan the final PNG manually and open the decoded URL for a final destination check. A QR page cannot pass unverified. A source SVG or pre-render test is insufficient because crop, contrast or resampling can break the final code.

## 12. Determinism rules

Pixel-identical output is guaranteed only when the OS, Chromium build and exact local font files are identical. Dependency, input and asset stability remains required as well. For repeatable output:

- keep the lockfile and Chromium version stable;
- use licensed local font files for every job, record their filenames, versions or hashes and licenses, and never depend on an undeclared system fallback;
- wait for `document.fonts.ready` before capture;
- avoid current timestamps, random values and network-loaded content in pages;
- use stable SVG, raster and CSS assets;
- keep PDF metadata fixed or explicitly supplied;
- do not use animations as a source of final state;
- record content input, render command and tool versions in QA.

The neutral example fixture uses the host's Arial or Helvetica installation to keep setup light. It validates the rendering workflow, but it is not a cross-platform pixel identity fixture. Replace its typography with job-local licensed font files before claiming deterministic client output.

Raster PDF output is visually faithful but its text is not selectable. State that limitation when an editable or accessible PDF was expected.

## 13. Failure recovery

| Failure | Correct response |
|---|---|
| Text budget exceeded | Rewrite, split or change page family; do not shrink below the reading system |
| DOM overflow | Inspect the marked element, title wrap and exclusion zones; render the page again |
| Missing local image | Fix the ledger-approved path; do not replace it with a remote URL |
| Final claim coverage fails | Add the exact relative path and matching visible text; classify it honestly instead of using blanket `proposal` |
| Placeholder token detected | Replace it with final client copy or remove the field; never weaken the scanner |
| Untrusted `.ts` or `.js` input | Do not execute it; convert the inspected structured content to JSON |
| Wrong image crop | Adjust focal position or prepare a new derivative; preserve the original |
| Broken alpha edge | Reprocess from the highest-quality original and inspect on two backgrounds |
| Unsupported family | Add a typed family or select the correct rhetorical family |
| Browser console error | Fix before capture; do not suppress it in the renderer |
| Mixed PNG dimensions | Reject and rerender the affected pages |
| PDF count mismatch | Regenerate from the audited PNG order |
| 375 px clipping | Fix the preview scaler or shell; do not alter the 2000 × 1414 artboard |
| Inconsistent output after rerender | check fonts, browser version, dynamic data and local asset changes |

Every correction requires at least targeted validation and rendering. Any change that affects ordering, theme, shared components, fonts or page geometry requires a full render and full contact-sheet review.

## 14. Delivery hygiene

Create distinct packages according to use:

1. `delivery/prospect/`: final PNGs, A4 PDF and contact sheet for the declared prospecting or client-delivery mode;
2. `delivery/author/`: editable source, lockfile, processed assets, redistributable fonts, font licenses, ledgers, strategy and QA needed to reproduce the result;
3. `delivery/public/`: only when requested, a neutral or explicitly public-cleared version with no private research, restricted font, client copy or asset.

The author package must be reproducible. If a font or asset cannot be transferred, replace it with a redistributable equivalent or document the exact dependency and keep the package private. Do not call source editable when its required local assets are missing.

Keep these in the appropriate delivery package:

- editable source and lockfile;
- brief, evidence ledger, claim map and asset ledger;
- diagnosis, platform and page map;
- final numbered PNGs and PDF;
- final contact sheet and QA report.

Exclude:

- `node_modules/`;
- `dist/` unless the user specifically needs a compiled preview;
- Playwright browser caches;
- stale review renders;
- rejected or unknown-rights assets;
- secrets, cookies, API tokens and private research exports;
- original exemplar decks and their assets.

Before handoff, reopen the delivered first, middle and final PNG plus the delivered PDF from their final paths. Complete the scorecard in `references/quality-gates.md`; a successful command sequence is only one part of completion.

Confirm that the delivered source still declares `meta.stage: "final"`, contains no HTTP asset, gives every final storyboard frame a local image and retains exact relative claim paths. Delivery is not a reason to relax the validator.
