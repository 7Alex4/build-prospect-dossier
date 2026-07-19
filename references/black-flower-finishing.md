# Black Flower Finishing Masters

## Purpose

This reference fixes the recurring Black Flower editorial frame that makes a dossier feel finished. Prospect research, imagery, color, material and motif must change. Production, Merci and the final lockup do not. An optional standalone References page may sit between Production and Merci.

Use this reference during page mapping, implementation and final visual QA. It is mandatory for a final Black Flower profile.

## 1. Coordinate system

The shipping canvas is 2000 × 1414 px. Use these optical rails:

| Element | Target |
|---|---:|
| Eligible interior running header left | x 84 |
| Eligible interior running header top | y 76 to 80 |
| Main editorial rail | x 140, tolerance 8 px |
| Standard title top | y 210 to 230 |
| Main body start | y 420 to 465 |
| Footer baseline zone | y 1280 to 1310 |
| Main outside inset | about 7% |
| Right motif zone | begins near x 1500 |

These are optical targets, not permission to nudge every page independently. Define shared tokens and let repeated masters inherit them.

## 2. Finished-space discipline

Premium space is structured space.

- Keep one dominant gesture per page.
- Keep three substantive blocks maximum on a standard page.
- Leave at least 44 px between unrelated groups.
- Keep at least 30% of a 12 × 8 inspection grid calm.
- Keep ordinary editorial occupancy between 22% and 48%.
- Keep Production occupancy between 32% and 48%.
- Keep Merci occupancy between 20% and 42%.
- Keep final-lockup occupancy between 1% and 5%.
- Reject an ordinary body page below 18% occupancy. That is usually unfinished emptiness, not restraint.
- Put captions below images, never inside an overlay strip.
- Use radius 0 to 12 px for recurring photographic masters.
- Do not use cards, floating panels, shadows, pills, meters or dashboard residue to occupy space.

Creativity belongs in the prospect object, image, crop, motif, material and language. It does not belong in rebuilding the closing structure for every dossier.

## 3. Background rhythm

Declare `meta.backgroundRhythm` before layout:

### `stable`

- Use one body field for almost the entire dossier interior.
- Reuse the exact cover field on the final lockup.
- Allow four major field transitions maximum.
- Prefer the sequence `cover, body…, cover`.

### `binary-chapter`

- Use exactly two documented fields.
- Change field only on a cover, manifesto, film opener, visual peak or final lockup.
- Tag every switch through page-map rationale.
- Never introduce a third field to rescue a weak composition.

Every Black Flower slide declares `backgroundField: "cover" | "body"`. This field describes a recurring visual state, not brightness. The shared cover/final field may be light, colored or dark. Tone and texture come from the measured prospect system. Accent and signal fields are not body-background shortcuts.

Render a contact sheet and print the field sequence in QA. Reject random alternation.

## 4. Production Black Flower master

### Purpose

Production introduces a person, a point of view and the ability to carry the work. It is not a planning table.

The approved Black Flower portrait is mandatory. A generic studio image, biography block, production still or reference thumbnail cannot replace it.

### Required data contract

```ts
{
  type: "production",
  variant: "black-flower-portrait",
  title: "PRODUCTION BLACKFLOWER",
  lead: string,
  role: string,
  approach: readonly string[],
  strength: string,
  portraitCaption: string,
  image: ImageAsset,
  compositionFamily: "portrait-profile",
  visualIntent: "image-led"
}
```

The lead is a two-to-eight-word prospect-specific signature. Keep it on one line.

The left column contains exactly:

1. `Notre rôle`
2. `Notre approche`
3. `Notre force`

Use three to five approach points. Do not add an eyebrow, workstream numbers, deliverables, constraints, owner labels or a second operational panel.

### Geometry

| Element | Target at 2000 × 1414 |
|---|---:|
| Title start | x 140 to 152, y 216 to 234 |
| Tagline | x 140 to 152, y about 304 |
| First section | x about 140, y 448 to 480 |
| Left text end | x 998 to 1040 |
| Portrait | x 1120 to 1160, y 438 to 478 |
| Portrait size | 600 × 760, tolerance 20 px |
| Caption | 18 to 24 px below portrait |
| Text-image gutter | 90 to 145 px |

The first section and the top of the portrait align within 24 px. The portrait remains visually primary. The motif may sit behind its right edge when it is prospect-derived and quiet.

### Portrait asset contract

Use an isolated vertical portrait, never a flattened slide screenshot.

- `mediaRole: "portrait"`
- `mediaNature: "portrait"`
- `productionStatus: "final"`
- `presentation: "frame"`
- `fit: "contain"`
- `sourceDimensions` required
- source width-to-height ratio from 0.65 to 1
- `subjectSafeBox` required
- at least 3% vertical air around the safe box
- face, hair, jaw, shoulders and upper torso remain visible
- no page header, page number, dossier text or motif inside the portrait asset
- no `object-fit: none`

If only an approved source dossier contains the portrait, create a job-local isolated derivative from the portrait region, record the transformation in the asset ledger and inspect it at 200%. Never register the whole page raster as a portrait.

### Hard rejection

- Title differs from `PRODUCTION BLACKFLOWER`.
- Lead wraps to two lines.
- One of the three fixed sections is absent.
- More than three editorial sections are present.
- Workstreams, deliverables or constraints appear.
- Portrait sits left of the canvas center.
- Source ratio is landscape or equals the 2000 × 1414 slide ratio.
- Subject safe box reaches a crop edge.
- Caption overlaps the image.
- Page resembles a dashboard or production sheet.

## 5. Merci master

### Purpose

Merci closes the reading as a calm editorial letter. It does not convert the page into a meeting-booking component.

### Required data contract

```ts
{
  type: "thank-you",
  variant: "black-flower-letter",
  title: "MERCI",
  paragraphs: readonly string[],
  closing: string,
  signature: string,
  platform: string,
  image?: ImageAsset,
  compositionFamily: "closing-letter"
}
```

Use three or four paragraphs. The complete letter, including the closing line, contains 75 to 135 words. End with `Merci encore et à bientôt !` unless the output language requires a faithful equivalent.

Recommended progression:

1. State what the dossier has read or revealed.
2. State what the platform does not try to add or imitate.
3. State what the platform makes visible, clear or memorable.
4. Express the Black Flower perspective with restraint.
5. Close simply.

The signature block uses two lines: `BLACKFLOWER × PROSPECT`, then the platform name. The cover and metadata must already disclose an independent proposal truthfully.

### Geometry

| Element | Target |
|---|---:|
| Title | x about 140, y 210 to 240 |
| Letter start | y 295 to 420 |
| Letter width | 850 to 1150 px when an object is present |
| Body | 25 to 32 px, line-height 1.28 to 1.42 |
| Paragraph gap | 28 to 70 px |
| Signature | x about 140, y 1060 to 1215 |
| Prospect object | right 25% to 45% of the canvas |

Return an object or motif already established in the dossier. It may exit the right edge. Do not invent a new decorative language for the close.

### Hard rejection

- Eyebrow or kicker above `MERCI`.
- Period after `MERCI`.
- Title begins below y 280.
- Letter begins below y 460.
- Fewer than three paragraphs.
- Fewer than 75 or more than 135 words.
- Contact card, contact details, URL, booking duration, CTA rule or hard-sell next step.
- Missing prospect object or full prospect-derived motif.
- New visual language introduced on the penultimate page.
- Missing Black Flower and prospect signature block.

## 6. Silent final lockup

### Purpose

The final page returns to the cover field and ends in silence.

### Required data contract

```ts
{
  type: "lockup",
  variant: "black-flower-co-mark",
  client: string,
  clientMark: ImageAsset,
  studioMark: ImageAsset,
  separator: "times",
  compositionFamily: "lockup",
  visualIntent: "typographic"
}
```

Both marks are local approved assets with:

- `mediaRole: "identity"`
- `mediaNature: "brand-mark"`
- `productionStatus: "final"`
- `fit: "contain"`
- `presentation: "cutout"`

Use the real prospect mark on the left, a quiet `×`, and the Black Flower flower on the right. Balance optical weight, not raw file dimensions.

### Geometry

- group direction: horizontal;
- group center y: 707, tolerance 20 px;
- group width: 220 to 380 px;
- visible mark height: normally 60 to 120 px;
- optical-height ratio between marks: 1.35 maximum;
- separator size: about 18 to 23 px;
- separator side gaps: about 25 to 45 px;
- center the group in the calm field, not automatically in the canvas when a large right motif changes the optical field.

### Silence contract

The foreground contains only:

1. prospect mark;
2. multiplication sign;
3. Black Flower flower.

Hide the running header, page number, footer, chapter mark and all body copy. Do not render a relationship label, legal line, URL, platform, contact, CTA, prospect name typed as a logo substitute or Black Flower wordmark.

The recurring cover field may retain its documented prospect-derived background motif or material texture. Treat it as part of the field, never as a fourth foreground object, a substitute mark or a new decorative gesture.

Independent-proposal truth belongs on the cover and in metadata. The silent final never replaces that disclosure.

### Hard rejection

- Prospect is represented by typed text instead of its approved logo.
- Marks are stacked vertically.
- Black Flower dominates the prospect mark.
- Group center falls outside the allowed vertical band without documented optical compensation.
- Header, pagination, paragraph, legal line or CTA is visible.
- Background does not close the cover loop.
- A third mark or any additional visible text appears.
- A foreground motif competes with the three-part co-mark.

## 7. Micro-rules against generic output

- Repeat these three finishing masters across dossiers. Their recurrence is authorship, not lack of variety.
- Keep titles on the same rail and near the same vertical level.
- Keep bodies near the upper third, not floating in the bottom half.
- Use one prospect-derived motif on roughly 40% to 70% of pages.
- Keep ordinary motif opacity around 4% to 14%.
- Keep material texture around 2% to 5%.
- Use a strong object crop on 30% to 50% of the page only when it carries meaning.
- Limit equal three-column pages to two per dossier.
- Use a long rule at most once on an ordinary page.
- Do not use a red or accent title by default. Accent must come from the prospect system or a documented function.
- Do not add a diagram where a photograph, product, screenshot, reference or short sentence would communicate better.
- Do not mistake many small labels for refinement.

## 8. Required automated checks

Run all checks against the final Chromium render:

### Production

- title, lead, first section and portrait bounding boxes;
- one-line lead height;
- portrait source ratio and safe box;
- `object-fit: contain`;
- no figcaption from asset-credit residue;
- no workstream, deliverable, constraint or index classes.

### Merci

- title and first-paragraph positions;
- paragraph and word counts;
- signature position;
- right-object occupancy;
- no eyebrow, contact card or CTA component.

### Lockup

- exactly two image assets and one `×` text node;
- no running header, footer, pagination or chapter mark;
- no foreground object beyond the two marks and `×`; the documented cover-field motif may remain in the background;
- horizontal order prospect then Black Flower;
- group width and center y;
- exact same cover field as page 1.

### Dossier rhythm

- declared background sequence;
- stable mode has four transitions maximum;
- binary-chapter mode uses exactly two documented fields and switches only on mapped chapter or peak pages;
- six composition silhouettes minimum;
- three visual peaks minimum;
- no more than three substantive blocks on an ordinary page;
- no interface residue on Production, Merci or lockup.

After automated checks, inspect the three pages at 100%, then inspect their sequence on the contact sheet at 25%. A passing schema cannot judge optical balance, crop credibility or whether the prospect object feels inevitable.
