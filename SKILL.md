---
name: build-prospect-dossier
description: Research, strategize, write, art-direct, render, audit, and quality-check image-led Black Flower prospecting dossiers as 15–20 A4-landscape pages, numbered PNGs, an A4 PDF, and editable strict-TypeScript source. Use when a user asks Black Flower to create a strategic creative dossier, outreach deck, campaign proposal, film proposal, or repeatable prospect-dossier factory for a company, or supplies a Canva, PDF, or PNG prospect dossier to extend, repair, audit, or re-render. Use 21–23 pages only for an explicitly justified full campaign proposal. Do not trigger for generic company research or an unrelated presentation.
---

# Build Prospect Dossier

Build a researched Black Flower creative proposal in which strategy alternates with real objects, proof, cultural references, campaign scenes and execution. Do not produce a decorative deck with invented strategy, or a consulting report disguised as art direction.

Default to a complete, client-ready result without asking questions. A company name plus the request for a dossier is enough to begin. Treat the user's angle and film ideas as authoritative when supplied; infer the strongest defensible angle when they are absent.

## Non-negotiable contract

- Work from evidence. Never invent a date, product, founder, capability, client, quote, market fact, award, location, reference, or brand intention.
- Separate facts, observations, strategic interpretations, and creative proposals in working notes.
- When exemplars are supplied for a job, use them only to understand structure, never as a source of reusable client-specific colors, motifs, metaphors, copy, or images.
- Default to real imagery whose provenance, rights basis and distribution scope are documented. `Provided` and `official` describe origin, not permission. Alex's Black Flower profile carries standing authorization for creative generation; every other profile requires explicit authorization.
- Make every selected image prove, dramatize, or clarify a specific claim. Reject generic atmosphere.
- Use `Black Flower Creative House` as the canonical studio identity and `BlackFlower` as its visible signature. Nexaia may remain the technical maintainer, but it is never the author visible on a prospect dossier.
- Default Alex's Black Flower jobs to `frameworkProfile: "black-flower"` and `generativeAssets: "authorized"`. For outside users of the open-source skill, require explicit authorization before generating images.
- Make 45–65% of pages image-led, with a target of 55%. At least 60% of those visual pages must use real, official, documentary, licensed or supplied assets. A logo, motif, texture or decorative SVG does not count.
- Use at most two genuinely necessary diagram pages. After the introduction, never place more than two text-led or system-led pages consecutively.
- Give every page an explicit visual intent. A missing image is a deliberate typographic decision, never a fallback rendered as cards, nodes, arrows, meters, pills or abstract geometry.
- Keep one dominant idea per page and normally no more than three content blocks.
- Produce 2000 × 1414 px PNG pages and an A4-landscape PDF.
- Preserve an editable source project. Pixel-identical rendering is guaranteed only with the same OS, Chromium build and licensed local font files.
- Keep `meta.stage` at `draft` while content is incomplete. Set it to `final` before the final validation, full render, audit and delivery.
- Give every final substantive visible field an explicit `ClaimRef`. Use a path relative to its slide, such as `title`, `columns[0].body` or `metrics[0]`, never `slides[0].title`. The claim text must resolve to the exact visible target; a metric claim must contain its value and label.
- Treat a displayed contact website as substantive copy with an exact `ClaimRef`. Keep image alt text, frame numbers, indices and timecodes outside claim coverage, but include them in placeholder and forbidden-term scans.
- Classify every claim deliberately. Never apply a blanket conversion that labels all visible copy as `proposal` merely to pass validation.
- In the Black Flower profile, studio identity is required and fixed to the canonical identity above. In an explicit neutral profile, studio identity remains optional and must never be invented or given an empty layout slot.
- In a final storyboard, every frame must use a local approved image. Remote HTTP assets and visible placeholder tokens are hard failures.
- Scan rendered theme strings too, including logo fallback, wordmark alt text, running header and every theme image alt.
- Register every image and theme asset in the dossier asset registry, with its origin, rights basis and allowed distribution scopes. Unregistered or uncleared assets are hard failures.
- Run the evidence, content, visual, and technical gates before delivery. A successful build alone is not completion.

## Read references by phase

Read only the files required for the current phase, but read each selected file completely.

| Phase | Required reference |
|---|---|
| Black Flower identity and visual contract | `references/black-flower-profile.md` |
| Inputs and research | `references/research-and-evidence.md` |
| Strategic angle and platform | `references/strategy-framework.md` |
| Page count and narrative order | `references/narrative-architecture.md` |
| Brand grammar, logo, type, color, motif | `references/visual-system.md` |
| Image acquisition and treatment | `references/image-direction.md` |
| Client-facing writing | `references/copy-system.md` |
| Page composition | `references/slide-blueprints.md` |
| Project creation and rendering | `references/production-workflow.md` |
| Final validation | `references/quality-gates.md` |

Read `references/method-synthesis.md` when deriving the system or choosing between variants. It contains only generalized method rules.

## Existing source dossier branch

When the input includes a Canva export, PDF, prior dossier or unordered page images, audit it before entering the standard workflow:

1. inventory every source file and preserve the untouched originals;
2. render PDF pages to images when necessary;
3. natural-sort pages and generate a contact sheet;
4. inspect every page at full resolution;
5. record canvas, anchors, palette roles, type roles, image roles, background states, motifs, page markers and repeated masters;
6. map each page's rhetorical job and extract only short labels needed to understand structure;
7. flag duplication, placeholders, internal notes, bad links, unsupported claims, unreadable frames, weak endings and rights uncertainty;
8. create a `keep / rebuild / remove` decision for every page;
9. retain the source's reasoning and measured system without redistributing proprietary copy or assets;
10. return to the standard brief, evidence, strategy, implementation and QA workflow.

If the source is a user-supplied dossier, keep source-specific forensics job-local. Reusable references must contain only autonomous, generalized rules.

## Workflow

### 1. Resolve the brief without blocking

Create `brief.yaml` immediately. Record:

- framework profile: `black-flower` by default for Alex, `neutral` only when explicitly requested;
- studio: `Black Flower Creative House` and visible signature `BlackFlower` in the Black Flower profile;
- company, brand, product or service;
- decision-maker and audience if known;
- user-supplied angle, constraints, films, references, and desired page count;
- angle status: `fixed`, `adaptable`, or `open`;
- output language and Black Flower identity, or optional studio identity only for an explicit neutral profile;
- distribution mode: private prospecting, client-approved work, or public release;
- relationship status: independent proposal, client-approved, or commissioned;
- generative assets: `authorized` for Alex's Black Flower framework; otherwise `forbidden` unless the user explicitly authorizes them;
- forbidden client-facing terms from active project instructions;
- assumptions and missing inputs;
- target outcome: meeting, creative conversation, proposal, or production mandate.

Classify a specific user-supplied angle as `fixed`, a directional territory as `adaptable`, and no angle as `open`. A fixed angle remains the root; candidate work may sharpen its expressions but may not replace it. If the angle is missing, infer it after research. If a film idea is missing, create film concepts only when the company and proposition genuinely benefit from them. If an asset is missing, use the fallback ladder in `references/research-and-evidence.md`; do not stop unless the company itself cannot be identified.

### 2. Create the production workspace

Copy `assets/dossier-engine/` into a new project directory. Keep the skill package unchanged.

Use this job structure:

```text
project/
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
├── src/content/
│   ├── brand.ts
│   ├── evidence.ts
│   └── deck.ts
├── qa/
├── output/
│   ├── slides/
│   ├── contact-sheet.png
│   └── dossier.pdf
└── delivery/
    ├── prospect/
    ├── author/
    └── public/        optional, only when requested and cleared
```

Follow `references/production-workflow.md` for commands and file contracts.

### 3. Research the company and acquire proof

Research before naming the territory. Prefer current primary sources: official website, newsroom, press kit, product pages, official social accounts, annual material, registries, and first-party interviews. Use independent trade or reputable editorial sources for context and verification.

Create one evidence row per source-backed fact or observation, then one claim-map row per final client-facing statement. Save the exact visible wording, typed content path, evidence IDs and claim class. Save one asset row per logo, product image, screenshot, archive, portrait, reference, or licensed photo.

Capture the actual communication baseline:

- homepage and key product or service pages;
- current social grid or recent posts;
- product range, packaging, place, process, people, or interface;
- brand history and current business moment;
- recognizable codes, shapes, materials, colors, phrases, and behavior;
- one to three relevant comparators or adjacent references.

Do not use search snippets as evidence. Do not rely on memory for facts that may have changed.

### 4. Prepare identity assets

Acquire the official vector logo when possible. Keep the untouched original, then create transparent light and dark monochrome variants. Never stretch, redraw, crop, or silently alter the mark.

Prepare:

- `logo-original.svg` or the highest-quality official raster;
- `logo-dark.png` and `logo-light.png` with transparent backgrounds;
- optional symbol-only variants;
- studio logo variants only when supplied by the user or project;
- a tested prospect attribution, plus studio attribution when available, with optical spacing and a truthful relationship label.

Do not bundle client or studio marks into this open-source skill. Keep them job-local.

### 5. Write the strategic diagnosis

Resolve these questions from evidence:

1. Why now, or why does this matter durably when no time-bound event exists?
2. What existing capital must be respected?
3. What perception or communication gap is visible?
4. What obvious creative shortcut must be refused?
5. What distinctive truth can carry a larger story?
6. What human, cultural, or business tension makes it matter?
7. What shift turns the truth into an active promise?
8. What platform phrase can organize many executions?
9. What first activation proves the platform best?

Use `references/strategy-framework.md`. For `open`, produce at least three candidate platforms. For `adaptable`, produce three compatible interpretations. For `fixed`, produce three executions or verbal expressions of the supplied root without changing its meaning. Score them, retain one, and keep rejected options and reasons in `strategy/diagnosis.md`.

### 6. Extract the brand grammar

Build a new visual grammar from this company, not from an exemplar. Document:

- cover, body, and final background regime;
- ink, support, and functional accent colors;
- headline, body, display-number, and caption type roles;
- one architectural motif derived from a real brand or product code, or a documented typographic/grid system when no distinctive object exists;
- image crop and cutout logic;
- page marker, chapter marker, micro-header, and lockup behavior;
- safe zones and density limits.

Keep the prospect-specific grammar inside the persistent Black Flower editorial frame defined in `references/black-flower-profile.md`. The prospect supplies the objects, imagery, materials, palette and motif. Black Flower supplies the authorship, rhythm, hierarchy and production logic.

Use measured colors and official assets. If brand fonts are unavailable or unlicensed, choose open-source equivalents by letterform and mood, and label them as substitutions.

### 7. Choose the dossier profile and map every page

Default to the 18–20-page standard profile. Use 15 pages for a focused opportunity without film execution. Use 21–23 pages only when the user requests or the brief explicitly justifies a full campaign proposal with product variants, distinct routes, storyboard and verified references.

Create `strategy/page-map.md` before writing full copy. For every page record:

- page number and family;
- purpose in the argument;
- single takeaway;
- evidence IDs;
- claim IDs and exact content paths for client-facing assertions;
- content blocks;
- image role and asset ID;
- visual intent: `image-led`, `image-supported`, `typographic` or `diagram`;
- visual-intent rationale;
- composition family and why it earns its place;
- visual peak: mark at least three pages across the dossier;
- transition from the previous page;
- unanswered question or risk.

Follow `references/narrative-architecture.md`. Do not add filler to reach a page count. Do not let film ideas appear before the strategic platform is established.

### 8. Draft copy within layout limits

Write the titles, subtitles, claims, blocks, captions, source notes, references, thank-you letter, and final lockup before implementation.

Apply `references/copy-system.md` and the content limits in `references/slide-blueprints.md`.

For French client output:

- use Swiss French and systematic `vous`;
- write directly, concretely, and without corporate filler;
- never use em dashes;
- do not use protected professional-title wording prohibited by the active project instructions;
- keep English only for a deliberate platform, signature, or concise strategic label.

Run a contradiction and duplication pass. A repeated block, unresolved placeholder, internal note, or half-chosen option is a hard failure.

### 9. Build the image plan before layout

Create an image brief for every page that needs media. Specify subject, proof function, source class, orientation, crop, tonal needs, and rejection criteria.

Use the image ladder:

1. provided original;
2. official press or product asset;
3. verifiable brand-owned social or archive image;
4. licensed editorial or stock image with a precise concept role;
5. authorized generated campaign scene, film territory, moodboard or storyboard;
6. original Black Flower drawing, collage or material experiment;
7. a diagram only when it explains a real relation, sequence or quantity better than an image and a sentence.

For generated campaign scenes containing a product, generate the scene without falsifying the product, then composite the real approved product cutout. Never generate a logo, product proof, employee, factory, archive or historical fact.

Record provenance, rights basis and permitted distribution mode. `Official` and `provided` describe origin, not permission. Never remove a watermark, fabricate a source, imply ownership or assume a private proposal asset can be published later.

### 10. Implement with the dossier engine

Populate `src/content/brand.ts`, the typed evidence registry and `src/content/deck.ts`. Reuse a page family only when its rhetorical job matches the content. Adjust the component or add a new typed family when the argument needs a genuinely different structure.

Requirements:

- React functional components and named exports;
- strict TypeScript, no `any`, no dead code;
- content separate from layout;
- files below 300 lines;
- real assets referenced from the project;
- a typed root `assets` registry mirroring the asset ledger, with unique IDs, source or ledger identity, origin, rights basis, approved status and compatible distribution scopes;
- every `ImageAsset.id` resolved through that registry, with asset usage derived by traversal rather than manual `slide.assetIds`;
- consistent page numbers and chapter markers;
- unique ASCII kebab-case slide IDs such as `01-cover`; never expose a technical slide ID as footer copy;
- typed claim metadata for factual, quoted and observational copy;
- required `meta.stage`, kept at `draft` during incomplete work and changed to `final` for the final gate;
- exact relative `contentPath` values for all final substantive visible fields;
- local images for every final storyboard frame;
- typed `frame`, `cutout` or `background` media presentation; use a separate real `productCutout` over a route scene when relevant;
- one approved image per creative-method step when the method is declared as an image sequence;
- `prefers-reduced-motion` respected in preview behavior;
- no decorative gradients, blobs, particles, confetti, glass cards, fake dashboards, or unrelated icons.
- explicit `visualIntent`, `visualIntentRationale`, `compositionFamily` and `visualPeak` metadata matching the page map;
- no generic orbit, signal, grid or abstract line motif in a final Black Flower dossier;
- no equal-card grid, decorative flowchart, severity meter, progress bar, pill cloud, dark central platform card or text-only film route as a final composition;
- image-led routes, activation, storyboard and production pages using approved local assets;
- the Black Flower running header, pagination and signature contract from `references/black-flower-profile.md`.

### 11. Render, inspect, and iterate

Run type-check, build and tests. Then set `meta.stage` to `final` before the final content validation and deterministic render. Produce numbered PNGs and the PDF. The final validator must scan placeholders, claim coverage, claim targets, local storyboard images, remote assets and asset-registry rights automatically. The delivery render report must be `final`, unselected and complete: `renderedCount === totalSlides === renderedSlideIds.length`.

Inspect three times:

1. every page at 100% for type, crop, edges, claims, spelling, and collisions;
2. the contact sheet for pacing, background rhythm, motif continuity, density, image variety, and closing strength.
3. the contact sheet at 25% for at least six distinct silhouettes, three visible peaks and an immediately recognizable world of the prospect.

Compare at least one cover, one diagnostic page, one text-only page, one proof page, one concept page, one production/reference page, the thank-you page, and the final lockup against the measured brand grammar and the relevant blueprint.

Run every hard gate in `references/quality-gates.md`. Fix failures and render again.

### 12. Deliver the complete dossier package

Return:

- `delivery/prospect/slides/01-stable-id.png` through the final naturally numbered page;
- `delivery/prospect/dossier.pdf` and `delivery/prospect/contact-sheet.png`;
- `delivery/author/` with editable strict-TypeScript source, lockfile, allowed processed assets and redistributable fonts;
- brief, evidence ledger, claim map and asset ledger in the author package;
- page map, diagnosis and retained platform notes in the author package;
- QA report listing checks run, passed, corrected, and any clearly disclosed limitations;
- `delivery/public/` only when requested and only with neutral or explicitly public-cleared material.

Lead the handoff with the result and the retained strategic platform. Do not expose raw reasoning or overwhelm the user with process logs.

## Hard stop conditions

Do not deliver when any of these is true:

- a material claim lacks evidence or is contradicted;
- a factual, quoted or observational statement lacks a claim-level evidence mapping;
- a logo, product name, person, date, quote, or reference is uncertain on a client-facing page;
- an image lacks known provenance or reuse status;
- an asset is not cleared for the declared distribution mode;
- a page contains a placeholder, internal note, unresolved alternative, or duplicated block;
- alt text, frame numbering, a timecode, contact website or rendered theme string contains a placeholder or forbidden client term;
- `meta.stage` is not `final` for the delivery render;
- a final substantive visible field lacks an exact resolving claim, uses an absolute deck path, or was covered by blanket `proposal` classification;
- a final storyboard frame lacks a local approved image, or any asset still uses HTTP;
- an image ID is missing or unregistered, a used registry row is not approved, its scope does not cover the delivery mode, or generated origin conflicts with policy;
- `render-report.json` describes a draft or selected render, or its counts and rendered IDs do not prove a complete deck;
- text clips, collides, becomes unreadable over the motif, or enters the protected right zone;
- the dossier copies an exemplar-specific palette, motif, metaphor, or client asset;
- the cover or final lockup implies a mandate, partnership or endorsement that does not exist;
- a Black Flower dossier is signed Nexaia, omits Black Flower authorship or uses a generic studio placeholder;
- fewer than 45% or more than 65% of pages are image-led without an explicit, documented exception;
- fewer than 60% of visual pages use real or documentary assets, or generated images exceed 40% without an explicitly concept-art-led brief;
- more than two pages are primarily diagrammatic, more than two text/system pages run consecutively after the introduction, or fewer than six composition silhouettes exist;
- a risk, route, priority activation, storyboard or production page substitutes cards, arrows, meters, generic geometry or text for meaningful media;
- the dossier contains no concrete photograph, product, screenshot, archive, portrait, cultural reference, scene or storyboard;
- hiding the logos makes the prospect unrecognizable from the visible objects, materials, people, references and places;
- the platform is only a generic slogan and cannot generate distinct pages or activations;
- type-check, build, content validation, render, dimension check, or visual inspection fails.

## Included resources

- `assets/dossier-engine/`: editable strict-TypeScript renderer and neutral sample.
- `scripts/`: deterministic source, logo, and dossier audit utilities when present.
- `references/`: strategy, research, art direction, page blueprints, generalized method synthesis, production, and QA instructions.

Never add a client dossier, logo, photograph, campaign copy or other third-party job material to the reusable skill package.
