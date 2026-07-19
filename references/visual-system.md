# Visual System

## Purpose

Apply a stable editorial discipline while deriving every brand-specific decision from the current prospect.

## Table of contents

1. Fixed production geometry
2. Variable brand grammar
3. Background rhythm
4. Palette extraction
5. Typography
6. Architectural motif
7. Logos and lockups
8. Page markers and micro-navigation
9. Image and object treatment
10. Density and whitespace
11. Responsive preview
12. Prohibited residue

## 1. Fixed production geometry

Default canvas:

- width: 2000 px;
- height: 1414 px;
- ratio: 1.414:1, A-series landscape;
- opaque RGB output;
- PNG page names: `01-stable-id.png`, `02-stable-id.png`, and so on.

Use normalized geometry so the engine can scale without changing composition.

| Token | Pixels | Percent | Role |
|---|---:|---:|---|
| Micro left | 84 | 4.2% | Eligible interior running-header and pagination alignment |
| Main left | 140 | 7% | Titles, content and media alignment |
| Main right | 140 | 7% | Default outer breathing room |
| Header top | 74 | 5.2% | Eligible interior running-header baseline zone |
| Title top | 210–228 | 14.9–16.1% | Standard title start |
| Footer baseline | 1300 | 91.9% | Eligible interior page-number and chapter-marker zone |
| Motif reserve start | 1500 | 75% | Default protected right zone when a large motif is present |
| Three-column starts | 140 / 690 / 1240 | 7% / 34.5% / 62% | Standard diagnostic and concept grid |
| Two-column split | 980–1080 | 49–54% | Editorial split and media layouts |

These are factory anchors, not a demand to reproduce another dossier. Change them only for a measured reason and keep the new grid consistent across the deck.

### Safe areas

- Keep essential text inside x = 140–1500 when a large right motif overlaps the canvas.
- Keep standard titles below 1600 px wide. Split or reduce size before entering the outer margin.
- Keep page markers away from media and captions.
- Reserve at least 44 px of visual separation between unrelated text blocks.
- Inspect metallic, transparent and high-contrast cutouts at 200% scale.

## 2. Variable brand grammar

In the default Black Flower profile, the production frame is fixed while the prospect grammar remains variable. Read `black-flower-profile.md` first. Keep `Black Flower Creative House` as canonical studio and `BlackFlower` as visible signature. Show the running header at top left and pagination at bottom left only on eligible interior pages. Never show either on the cover or silent final. Never render Nexaia as the creative author.

Rebuild these for every prospect:

- shared cover/final background;
- body background;
- primary ink and inverse ink;
- functional accents and their meaning;
- title and body family;
- display number or chapter-marker family;
- motif asset, crop, side, scale, opacity and fill/stroke behavior;
- logo placement and lockup proportions;
- image crop, corner and cutout behavior;
- texture or material field;
- chapter markers and pagination style.

Never begin a new dossier by copying an exemplar's CSS tokens.

Create a short grammar statement before implementation:

```text
The dossier uses [stable or binary-chapter rhythm], [type mood], and [one architectural motif]
to make [brand truth] feel [three tone words]. Images prioritize [proof classes].
Accents encode [functions], never decoration.
```

## 3. Background rhythm

Choose one declared model.

### `stable`

Use one body field across almost every interior page. Reuse the exact cover field on the silent final and allow no more than four major transitions. The normal sequence is `cover, body…, cover`.

### `binary-chapter`

Use exactly two documented fields. Switch only on a mapped cover, manifesto, chapter opener, visual peak or final lockup. Record every switch in the page map and never introduce a third field to rescue a weak composition.

Every slide declares `backgroundField: "cover" | "body"`. These roles do not imply light or dark. Cover and body fields may use any measured prospect-specific tone.

Avoid full-field gradients unless an official brand system uses one as a core asset. Never use animated gradients.

## 4. Palette extraction

Build the palette from official material and measured pixels.

### Required roles

```text
coverField
bodyField
finalField (exact alias of coverField)
ink
inkMuted
inkInverse
motif
accentPrimary
accentSecondary
accentTertiary (optional)
rule
```

### Extraction procedure

1. Sample the official logo, website, product, packaging, place and press assets.
2. Identify stable colors versus colors present only in photography.
3. Choose a field color that supports long strategic reading.
4. Choose one ink with strong contrast.
5. Assign each accent a function such as chapter, tension, proof or route.
6. Test contrast on both body and cover fields.
7. Test the contact sheet. Accents should form a system, not confetti.

Default limits:

- one dominant field;
- one primary ink;
- one muted support;
- one to three functional accents;
- no accent used merely because a page feels empty.

Use subtle grain only when it is consistent with the brand's material world. Keep the grain quiet enough that small body text remains clean.

## 5. Typography

Use roles rather than a collection of fonts.

### Required roles

- `headline`: strong page titles and block headings;
- `body`: long-form strategic reading;
- `display`: cover title, platform phrase or major chapter only;
- `number`: page and sequence numbers when a distinct voice is justified;
- `caption`: provenance, image description and small labels.

One variable family may cover headline and body. A second family is justified only for a clear display or number role.

### Source identification

When a source deck is flattened:

1. inspect single- versus double-storey `a` and `g`;
2. compare `R`, `G`, `M`, numerals and punctuation;
3. compare x-height, width, terminals and weight;
4. label the result `probable` until a font file or source editor confirms it;
5. test by overlay before claiming an exact match.

### Default scale at 2000 × 1414

| Role | Typical visible size | Guidance |
|---|---:|---|
| Running header | 22–28 px | Quiet, regular |
| Page title | 64–88 px | Uppercase or source-led, heavy |
| Cover title | 84–130 px | May use lighter display weight |
| Subtitle | 28–36 px | One line or about 90 characters maximum |
| Block title | 38–50 px | Clear and compact |
| Body | 25–32 px | 1.28–1.45 line-height |
| Caption | 18–24 px | Never essential at tiny size |
| Page number | 34–46 px | Source-derived display or body family |

Use these as fit boundaries, not fixed values. The engine's validators should flag unusually long titles and bodies.

### Type discipline

- Keep standard titles to one or two lines.
- Keep body measure near 45–72 characters depending on size.
- Use weight, spacing and alignment before adding boxes.
- Avoid fully justified text when it creates distracting rivers. If source-like spacing is desired, inspect every line.
- Do not make text-only pages hero-sized. Use editorial composition, rules, numbers, quotes and motif pressure.

### Font licensing

Use brand font files only when provided or licensed. Otherwise use an open-source substitution and record it. Do not redistribute proprietary fonts in the skill or public project.

## 6. Architectural motif

Select one motif derived from evidence:

- logo symbol;
- product outline or component;
- architecture or place geometry;
- material pattern;
- interface behavior;
- package shape;
- archive mark;
- recurring gesture or tool.

The motif must do spatial work. Define:

- asset source;
- side or anchor;
- fill or stroke;
- crop boundaries;
- scale range;
- opacity or contrast;
- cover, body, chapter and final states;
- prohibited positions;
- protected text zone.

Good behavior:

- oversized and intentionally cropped;
- stable across adjacent pages;
- changed only by documented state;
- quiet enough behind copy;
- stronger on cover and final lockup.

Bad behavior:

- centered on every page;
- randomly moved to fill space;
- reconstructed when a real source asset exists;
- combined with unrelated decorative shapes;
- copied from an exemplar.
- abstract orbit, signal, grid or line language whose prospect origin cannot be explained in one sentence.

## 7. Logos and lockups

### Acquisition order

1. official SVG or PDF vector;
2. official transparent PNG;
3. highest-resolution official raster;
4. screenshot extraction only as a disclosed last resort.

### Processing rules

- preserve the untouched original;
- preserve aspect ratio and clear space;
- create transparent dark and light variants from a clean alpha mask;
- do not trace, simplify or redraw without authorization;
- do not remove a registered mark arbitrarily;
- test white logos on the exact cover field;
- test dark logos on the exact body field;
- export at least 2400 px on the long side for raster variants;
- inspect edges at 200%.

### Prospect and optional studio attribution

- In the Black Flower profile, studio attribution is required and fixed. If no cleared mark is available, use the text signature `BlackFlower`.
- When both marks exist, keep them optically balanced, not mechanically equal in width.
- Studio identity is optional only in an explicit neutral profile. When it is absent there, omit its mark, signature and layout slot completely. Do not invent a name to complete the composition.
- In independent prospecting, disclose `Proposition indépendante pour [prospect], par [studio]` on the cover and in metadata. A bare `prospect × Black Flower` pairing is permitted only on the silent final after that disclosure has been made.
- The Black Flower final master remains silent in the foreground: real prospect logo, `×`, Black Flower flower. It contains no relationship copy. The cover carries the relationship truth for the complete dossier. The documented prospect-derived cover motif or material texture may remain behind the marks as part of the field.
- Respect each mark's clear space.
- Do not combine marks into a single irreversible raster until final rendering.
- Use the full truthful attribution on the cover. Use the silent mark-only lockup on the final page. Use either elsewhere only when the page has a real identification need.
- A prospect logo identifies the recipient; it does not signal endorsement. Never write `en collaboration avec` without evidence of that relationship.

## 8. Page markers and micro-navigation

Use a quiet orientation system on eligible interior pages:

- Black Flower running header at the top-left micro guide: `Strategic creative campaign proposal · BlackFlower`;
- page number at bottom-left or a source-derived equivalent;
- chapter marker at bottom-right when chapter codes add value;
- a chapter label only on openers if necessary;
- no navigation object larger than the content it supports.

Hide this chrome on the cover and silent final. A deliberate full-field interior opener may hide part of it only when the page map records the exception and orientation remains clear.

Chapter codes must originate in brand or product logic when possible. Examples include product indexes, material samples, symbol states, shapes, colors or typographic numbers.

Do not invent icon sets merely to imitate a prior dossier.

## 9. Image and object treatment

- Use one main image per standard page.
- Use multiple images only for proof grids, sequence, comparison or storyboard.
- In a final storyboard, every frame uses an approved local image. A text-only frame marker is a draft state, never a client-ready visual.
- Keep screenshots documentary. Do not wrap them in fake devices unless the device is part of the proof.
- Use stable corners, normally 0–24 px at source resolution.
- Avoid shadows unless an official material system requires them.
- Cut out products with clean alpha edges and no light halo.
- Let a cutout overlap a photograph only when it reinforces the relationship between product and scene.
- Keep product scale credible and consistent across route pages.
- Use real portraits with names and roles only when verified.
- Keep visual source notes in the asset ledger even when credits do not appear on the page.

## 10. Density and whitespace

Standard page limits:

- one dominant idea;
- three content blocks;
- one main image;
- one motif state;
- one or two accent colors active;
- one concluding line only when it sharpens the page.

Exceptions:

- system page: four or five components around one anchor;
- architecture: four to six chapter rows;
- storyboard: 3–12 frames, using one row for 3–5, 3 × 2 for six when needed, and two balanced rows for 7–12;
- references: four concise entries;
- channel system: four or five roles.

Whitespace is active when it separates, prioritizes or builds tension. Empty space is not a substitute for insufficient content.

Across the dossier, 45–65% of pages are image-led, target 55%. Use at most two diagram pages, at least six distinct composition silhouettes and no more than two consecutive text/system pages after the introduction.

## 11. Responsive preview

The deliverable pages are fixed-size. The preview must scale the full canvas proportionally.

- At 1440 px viewport width, fit the slide without clipping and preserve the 1.414 ratio.
- At 375 px, show the complete page scaled down. Do not reflow the fixed deliverable into a different composition.
- Keep the preview background distinct from the slide edge.
- Avoid horizontal overflow.
- Disable nonessential preview transitions under `prefers-reduced-motion`.

Do not judge small client copy from a 375 px scaled preview. Inspect the 2000 × 1414 export at 100%.

## 12. Prohibited residue

Before delivery search for and remove:

- colors copied from any prior dossier without current-prospect evidence;
- any object silhouette, progress device, chapter code or crop logic imported from another dossier rather than derived from the current prospect;
- any source-specific platform word, product metaphor, route language or category tension imported without current-prospect evidence;
- old client names, product names, logos, flags, page markers, image paths or captions;
- screenshots of source slides used as final page layouts;
- generic luxury codes such as marble, gold dust, champagne, yachts or perfume lighting when unsupported;
- generic technology codes such as neon grids, holograms, glowing circuits or abstract AI imagery when unsupported.
- equal card grids, decorative flowcharts, fake metrics, severity meters, progress bars, pill clouds or dark platform boxes;
- a final Black Flower cover, production page or lockup signed Nexaia;
- a page whose missing image was concealed with generic vector geometry;
