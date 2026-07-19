# Quality Gates

## Purpose

Validate the dossier as a finished client artifact. Do not trade evidence, readability or source integrity for visual polish.

## Table of contents

1. Source and evidence
2. Strategy
3. Narrative
4. Copy
5. Visual system
6. Images and rights
7. Technical output
8. Visual inspection
9. Automated checks
10. QA report
11. Final delivery

## Gate model

A dossier is ready only when:

- every hard-failure check passes;
- the weighted score is at least 88/100;
- no section scores below 70%;
- every correction is followed by a new render and targeted reinspection.

## 1. Source and evidence gate, 15 points

| Check | Points |
|---|---:|
| Company, domain, product and audience are unambiguous | 2 |
| Every client-facing claim maps at claim level to its class and evidence IDs | 4 |
| Names, titles, dates, product variants and quotes are verified | 3 |
| Observations, interpretations and proposals are phrased distinctly | 2 |
| Current facts were checked from current primary sources | 2 |
| Conflicts and uncertainty were resolved or omitted | 2 |

Hard failures:

- material unsupported claim;
- page-level evidence used as a substitute for exact claim mapping;
- wrong company, product, person, date or quote;
- translated wording presented as an exact verbatim quote;
- search snippet used as evidence;
- creative proposal presented as an adopted client strategy;
- blanket classification of all visible copy as `proposal` without field-level semantic review;
- absolute or deck-level `contentPath`, unresolved path, or claim text that does not match its visible target;
- metric claim missing either the visible value or label;
- final substantive visible field without at least one valid resolving claim;
- stale leadership or product claim not checked.

## 2. Strategy gate, 15 points

| Check | Points |
|---|---:|
| `Why now?` is evidence-backed, or `Why this matters` uses a durable observed tension without false urgency | 2 |
| Existing capital is recognized before critique | 2 |
| Perception gap or risk is visible and fair | 2 |
| Obvious shortcut is refused without discarding authentic heritage | 2 |
| Retained platform is ownable, credible and concise | 3 |
| Platform can generate at least three genuinely distinct routes or applications | 2 |
| Priority activation answers why this, why this subject and why now | 2 |

Hard failures:

- platform could fit a close competitor unchanged;
- platform depends on invented motive or market claim;
- routes differ only by image, color or product name;
- activation appears without a strategic bridge;
- copied exemplar phrase, metaphor or route.

## 3. Narrative gate, 10 points

| Check | Points |
|---|---:|
| Page map exists before final implementation | 1 |
| Every page has one takeaway and one rhetorical job | 2 |
| Pages follow a clear recognition, gap, opportunity, platform, proof and close sequence | 3 |
| Page count is justified by evidence and execution depth | 1 |
| Chapter transitions change pace intentionally | 1 |
| Thank-you and final lockup close without new argument | 2 |

Hard failures:

- filler page;
- duplicate page purpose;
- film or campaign route introduced before the platform;
- missing conclusion or final lockup;
- final page contains unrelated new content.

## 4. Copy gate, 12 points

| Check | Points |
|---|---:|
| Titles are concise and specific | 2 |
| Body blocks respect the blueprint budgets or have deliberate exceptions | 2 |
| No duplication, contradiction or unresolved option | 2 |
| Swiss French, `vous`, punctuation and language mix are consistent | 2 |
| No corporate filler, unsupported superlative or generic agency language | 2 |
| Studio and reference copy stay factual and relevant | 2 |

Hard failures:

- `TODO`, `TBD`, `TBC`, `lorem`, `placeholder`, `[insert`, `à compléter` or internal note;
- old client, product, platform or image caption left in the deck;
- unresolved alternatives joined by `/`;
- duplicated paragraph;
- client-facing em dash when prohibited by active instructions;
- protected professional-title wording prohibited by active project instructions;
- any term listed in `brief.yaml` under `forbidden_client_terms`;
- unreadably small body copy used to fit excess text.

Run text searches across source files before rendering.

## 5. Visual system gate, 15 points

| Check | Points |
|---|---:|
| Background rhythm is declared as `stable` or `binary-chapter` and follows its mapped sequence | 2 |
| Palette is measured from the current prospect and accents have roles | 2 |
| Type roles and substitutions are documented | 2 |
| One source-derived motif behaves consistently | 3 |
| Main grid, header, title and footer anchors remain coherent | 2 |
| Text-only pages are composed, not empty or oversized | 2 |
| Cover and final lockup form a clear visual loop | 2 |

Hard failures:

- exemplar-specific palette, motif, metaphor or asset residue;
- random background changes;
- more than four major field transitions in declared stable mode;
- a binary-chapter rhythm with more than two fields or an unmapped switch;
- essential text under an intrusive motif;
- clipping, collision or protected-zone violation;
- generic decorative gradients, blobs, particles, confetti or glass cards;
- client logo distorted, redrawn or low-resolution without disclosure.
- lockup or wording implies a mandate, approval, endorsement or partnership that does not exist.
- Black Flower dossier signed Nexaia or missing the `BlackFlower` authorship frame;
- generic orbit, signal, grid or abstract line motif used in a final Black Flower dossier;
- repeated equal cards, decorative flowcharts, severity meters, progress bars, pills, fake dashboards or dark central platform cards;
- fewer than six composition silhouettes or fewer than three visible contact-sheet peaks.
- one composition family repeated on adjacent pages or used more than three times outside the strict film-route exception: one contiguous block of 2–4 compatible `film-concept` pages containing every route and exactly matching `meta.creativeRouteCount`;
- Production that is not the fixed portrait master, or that contains workstreams, deliverables or constraints;
- Merci with a kicker, CTA, contact details, URL, booking instruction, fewer than three paragraphs or no returning prospect object;
- final-lockup foreground with anything beyond the approved prospect logo, `×` and Black Flower flower; the documented cover-field motif may remain behind them;

## 6. Image and provenance gate, 13 points

| Check | Points |
|---|---:|
| Every image has a primary narrative or proof role | 2 |
| Every shipping image is cleared for the declared distribution mode | 3 |
| Product, person, place and archive details are accurate | 2 |
| Crop, resolution, alpha edges and color remain credible | 2 |
| Adjacent pages do not repeat the same visual role without reason | 1 |
| Storyboard, moodboard, screenshot and reference proof remain inspectable | 2 |
| Links and QR destinations match their labels | 1 |

Hard failures:

- unknown provenance or reuse status;
- `official` or `provided` treated as permission without a documented rights basis;
- private-proposal asset reused in a public artifact without new clearance;
- watermark or search interface in a shipping asset;
- generated image presented as evidence;
- generated or illustrative media used as brand truth, current-baseline proof, document or archive;
- wrong product variant or person;
- whole-slide raster registered or rendered as a portrait;
- production portrait without source dimensions, safe box or full head-and-shoulders visibility;
- broken image;
- unreadable storyboard or moodboard;
- `Watch`, `View`, `Read` or QR CTA pointing somewhere else;
- QR code not decoded from the final rendered PNG or decoded destination does not exactly match the labelled URL;
- missing timing on a storyboard that states a fixed duration.
- final storyboard frame without an approved local image;
- HTTP asset accepted as a warning or deferred until rendering instead of failing validation.
- fewer than 45% or more than 65% image-led pages;
- fewer than 60% of pages that actually render substantive slide media use real or documentary assets;
- generated imagery appears on more than 40% of those pages, regardless of declared visual intent;
- more than two pages are primarily diagrammatic;
- more than two text/system pages run consecutively after the introduction;
- `editorial-sequence` step without an image or product overlap without an exact contained cutout;
- risk, route, priority activation, storyboard or production lacks meaningful approved media;
- a motif, logo, texture or decorative SVG is counted as argumentative media.

## 7. Technical gate, 10 points

Run the engine's exact scripts from `references/production-workflow.md`.

| Check | Points |
|---|---:|
| Strict TypeScript type-check passes | 2 |
| Production build passes | 2 |
| Content validator passes | 2 |
| Renderer exits successfully with no browser console errors | 1 |
| All PNGs are 2000 × 1414 and naturally numbered | 1 |
| PDF page count, markers and rasterized page content match PNGs | 1 |
| Preview fits at 375 px and 1440 px without horizontal overflow | 1 |

Hard failures:

- type error, build error or validator error;
- final validation or delivery render run while `meta.stage` is not `final`;
- final claim coverage, exact target, automated placeholder, local storyboard image or HTTP asset check bypassed;
- `any`, dead code or unused import introduced in project code;
- any project code file at 300 lines or more;
- missing page, duplicate number or mixed dimensions;
- render-time console error;
- PDF marker, order or raster-content mismatch, or PDF raster audit unavailable because Poppler `pdftoppm` is missing;
- fixed-slide preview clipped at 375 or 1440 px;
- motion preview ignores `prefers-reduced-motion`.

## 8. Visual inspection gate, 10 points

Inspect every PNG at 100%, the full contact sheet, and the contact sheet at 25%.

### Page-level inspection

For every page check:

- title wrap and optical alignment;
- body legibility and line spacing;
- no word-spacing rivers from justification;
- motif contrast;
- image crop, edge and resolution;
- accent meaning;
- page number and chapter marker on eligible interior pages only;
- evidence/caption accuracy;
- no clipping, collision or accidental near-touch;
- coherent negative space.

### Contact-sheet inspection

Check:

- first impression and platform memory;
- chapter and background rhythm;
- density rises and falls intentionally;
- proof, text, diagram and image roles vary;
- motif is stable without becoming repetitive;
- accent colors create a code;
- Production and the separate References page, when included, arrive late;
- thank-you slows the sequence;
- final lockup feels inevitable.
- at least 45% of thumbnails are image-led and the ratio remains at or below 65%;
- at least six silhouettes are distinct;
- at least three pages stop the eye immediately;
- visible objects, products, materials, people, references and places make the prospect recognizable when logos are hidden;
- no long tunnel of cards, tables, timelines or diagrams exists.

Required representative comparisons:

- cover;
- one diagnostic page;
- one text-only page;
- one proof page;
- one platform or system page;
- one route or activation page;
- Production;
- the separate References page when included;
- thank-you;
- final lockup.

Hard failures:

- any page not inspected at final resolution;
- contact sheet not inspected;
- dense or sparse page that breaks the deck's rhythm;
- small text, image or frame that cannot be read at 100%;
- inconsistent motif or background state without narrative reason.
- Production, Merci or final lockup outside the geometry bands in `black-flower-finishing.md`.
- image-led ratio outside 45–65%;
- fewer than 60% real or documentary visual pages, or generated share above 40%;
- more than two primarily diagrammatic pages or more than two consecutive text/system pages after the introduction;
- fewer than six composition silhouettes or fewer than three contact-sheet peaks;
- risk, route, priority activation, storyboard or production page without substantive approved media;
- dossier that remains generic when logos are hidden;
- Black Flower dossier visibly authored by Nexaia.

## Automated output checks

The audit must verify:

```text
page count == deck definition count
PNG names == contiguous natural order
all PNG dimensions == 2000 × 1414
PDF page count == PNG count
PDF page filename and SHA-256 markers == each ordered PNG
Poppler-rasterized PDF page content == each ordered PNG within the audit tolerance
meta.stage == final before final validate, render, audit and delivery
every final substantive field >= one valid resolving slide-relative contentPath
displayed contact.website == exact resolving ClaimRef
every contentPath target == exact visible text after normalization
every metric target == value plus label
no blanket proposal classifier
every final storyboard frame == local approved image
every HTTP asset == validation error
every traversed ImageAsset.id == unique typed registry entry
every used asset status == approved
every used asset scope includes meta.distributionMode
every generated asset == meta.generativeAssets authorized
every registry src when supplied == traversed ImageAsset.src
slide.assetIds == absent because usage is derived
no missing referenced asset
no empty alt/caption field when required
no duplicate slide ID
every slide ID == unique ASCII kebab-case with no normalized output collision
technical slide ID == never visible footer fallback
no unsupported slide family
no overflow marker
Production == black-flower-portrait master with isolated safe portrait
Merci == black-flower-letter master with 3–4 paragraphs and prospect object
final-lockup foreground == exactly two approved marks plus one multiplication sign and zero chrome
stable background rhythm == no more than four cover/body transitions
binary-chapter background rhythm == exactly two documented fields and mapped switches only
repeated film-route master == one contiguous 2–4 page block, one compatible family, every film-concept slide, exact creativeRouteCount
composition adjacency and three-use cap == enforced outside the eligible film-route block and at both boundaries
no browser console error
no forbidden placeholder token
alt, frame number, index, timecode and rendered theme strings == scanned for placeholders and forbidden terms without ClaimRef coverage
theme logo fallback, wordmark alt and running header == scanned
render-report stage == final
render-report selectionApplied == false
render-report selection == []
render-report renderedCount == totalSlides == renderedSlideIds length
render-report traceability asset IDs == IDs derived from traversed images
render-report traceability evidence IDs == deduplicated slide plus claim evidence IDs
render-report.sha256 == exact render-report.json bytes
render-report source SHA-256 == audited source file
render-report loaded dossier SHA-256 == dossier loaded from source when supported
render-report generated asset == explicit authorizer and durable authorization reference
render-report asset source identity == hydrated content actually rendered
asset hydration <= 32 MiB each and <= 256 MiB total by default
```

Use a nonzero exit code for any hard failure.

## QA report contract

Create `qa/report.md`:

```markdown
# Dossier QA

- Company:
- Platform:
- Pages:
- Rendered at:
- Overall score:
- Hard failures: 0
- Stage: final

## Commands

- type-check: PASS
- build: PASS
- validate: PASS
- render: PASS
- audit: PASS

## Evidence

- facts checked:
- unresolved facts removed:

## Assets

- shipping assets:
- provided:
- official:
- licensed:
- generated with explicit authorization:
- reference-only excluded:

## Visual review

- pages inspected at 100%:
- contact sheet inspected:
- 375 px preview:
- 1440 px preview:

## Corrections made

1.

## Disclosed limitations

- None.
```

Do not use `Disclosed limitations` to excuse a hard failure. Fix the failure or remove the affected material.

## Final delivery gate

Before handoff verify that the package contains:

- numbered PNGs;
- matching PDF;
- contact sheet;
- editable source;
- brief;
- evidence ledger;
- claim map;
- asset ledger;
- diagnosis and retained platform;
- page map;
- QA report.

Open the final PDF and at least the first, middle and last PNG from the delivered paths. Do not assume files copied correctly because rendering succeeded elsewhere.

Reopen the delivered source and confirm `meta.stage: "final"`. Re-run validation against that exact source path before handoff. A draft source, absolute claim path, missing final frame image, remote HTTP asset or weakened placeholder scan blocks delivery.
