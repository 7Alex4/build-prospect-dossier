# Slide Blueprints

## Purpose

Map rhetorical jobs to stable page families. Coordinates assume a 2000 × 1414 px canvas and the default anchors in `visual-system.md`.

## Global frame

Standard content page:

- running header: x 84, y 74;
- title: x 140, y 210;
- subtitle: x 140, y 300;
- primary content top: y 420–455;
- page number: x 84, baseline near y 1300;
- optional chapter marker: bottom-right around x 1820, y 1275;
- main safe text area: x 140–1500 when the right motif is active.

The coordinates are starting points. Preserve the grid across the deck and adjust for the current type metrics.

## Table of contents

1. Cover
2. Architecture
3. Three-column diagnostic
4. Brand house or manifesto
5. Proof split
6. Risk split
7. Opportunity shifts
8. Strategic equation
9. Territory opener
10. Platform system
11. Communication system
12. Timeline or method
13. Route or film concept
14. Priority activation
15. Storyboard or execution proof
16. Production
17. References
18. Thank-you
19. Final lockup

## Blueprint to engine mapping

| Blueprint | Engine family and variant | Notes |
|---|---|---|
| Cover | `cover` | Use optional image and per-slide motif state |
| Architecture | `architecture` | Four to six nodes |
| Three-column diagnostic | `three-columns: why-now` | Rename the eyebrow to `Why this matters` when no current event exists |
| Three pillars | `three-columns: pillars` | Only for three genuinely parallel ideas |
| Brand house | `manifesto` or `proof` | Choose conviction or evidence, not visual similarity |
| Manifesto | `manifesto` | Short lines, not a long essay |
| Proof split | `proof` | Metrics and quotes require typed claim references |
| Risk split | `risk` | Image optional but must have a proof function |
| Opportunity shifts | `opportunity: shifts` | Use `opportunity: opportunity` for a single central move |
| Strategic equation | `platform: platform` or a new typed family | Add a family when the equation needs dedicated geometry |
| Territory opener | `platform: platform` | May use a strong image and alternate tone |
| Platform system | `platform: system` | Core plus operating layers |
| Communication system | `activation` or `platform: system` | Choose channels versus conceptual layers |
| Timeline or method | `timeline: timeline` or `timeline: method` | Preserve sequence and deliverables |
| Route or film concept | `film-concept` | One route per page when depth warrants it |
| Priority activation | `activation` or `film-concept` | Choose system versus one concrete concept |
| Storyboard or execution proof | `storyboard` | 3–12 frames with timecodes for fixed duration |
| Production | `production` | Real proof, deliverables and constraints |
| References | `references` | Source and relevance required |
| Thank-you | `thank-you` | Contact optional |
| Final lockup | `lockup` | Silent content allowed; relationship label remains truthful |

This mapping is a routing aid, not permission to force content into a near match. Add a new discriminated family when the rhetorical job or geometry is genuinely different.

For every family, keep `meta.stage: "draft"` until incomplete copy and imagery are resolved. Before final validation and rendering, set `meta.stage: "final"`. Every substantive visible field then needs an explicit claim with a slide-relative path such as `title`, `columns[0].body` or `metrics[0]`. The claim must match the visible target; a metric claim contains its value and label. Never use a deck path or blanket `proposal` classifier. HTTP assets are validation errors.

## 1. Cover

**Use for:** first page only.

**Anatomy**

- micro-header optional but consistent with the source line;
- prospect or product label;
- platform phrase or working dossier title;
- optional signature of one line;
- prospect attribution, plus studio attribution only when supplied, matching the declared relationship status;
- one architectural motif or product signal.

**Composition**

- use the cover field;
- place title in the left or center-left 55–65% of the canvas;
- let the motif occupy or enter from the outer 25–40%;
- place lockup below the title or near the lower third;
- omit page number.

**Content limit**

- label: 1 line;
- title: 1–2 lines;
- signature: 1 line;
- no paragraph.

**Reject when:** it resembles a marketing landing hero, uses generic atmosphere, or reveals the strategy through explanatory copy before the reader enters the dossier.

## 2. Architecture

**Use for:** page 2 or a deliberate chapter map.

**Anatomy**

- title;
- four to six chapter rows;
- one chapter code per row;
- motif or one proof image on the right;
- page number.

**Composition**

- list start x 180–260, y 430;
- row gap 78–105 px;
- code column 55–85 px wide;
- label column 520–780 px wide;
- motif or image may occupy x 1350–2000.

**Content limit**

- chapter label: 2–6 words;
- no descriptive paragraph under rows unless the source requires it.

**Reject when:** chapter labels are merely departments or the icon system has no brand logic.

## 3. Three-column diagnostic

**Use for:** `Why now?`, scene/tension/signal, three principles or three consequences.

**Anatomy**

- title and one framing sentence;
- three equal or near-equal columns;
- short accent bar or number above each block;
- block title and body;
- optional concluding line.

**Composition**

- starts: x 140, 690, 1240;
- width: 440–480 px;
- gutter: 65–105 px;
- content top: y 500–570;
- accent bar: about 150–200 × 14–20 px;
- maintain a protected outer area if the motif enters from the right.

**Content limit**

- 25–45 words per column;
- one conclusion of 8–18 words;
- no sub-subheadings.

**Reject when:** the opportunity repeats the moment, columns contain unequal rhetorical levels, or body type is reduced to fit excess copy.

## 4. Brand house or manifesto

**Use for:** distinctive brand codes, heritage, territory, philosophy or a quiet central thesis.

### Variant A: brand house

- title and one sentence at top;
- one real symbol or product code in the center;
- two to four codes, principles or short proofs around it;
- one evidence statement near the bottom.

### Variant B: manifesto

- narrow text measure, normally 680–1050 px;
- one compact heading;
- 4–8 short sentences or lines;
- three isolated verbs or behaviors;
- platform signature near the lower third.

**Content limit**

- 90–160 words total;
- no generic full-width prose slab.

**Reject when:** the page uses an invented heritage claim, decorative icon collection or giant type solely to fill the canvas.

## 5. Proof split

**Use for:** current communication, capability, product, people, place or process proof.

**Anatomy**

- title and subtitle;
- one image or screenshot;
- three proof blocks;
- one short evidence-backed conclusion if needed.

**Composition**

- image-left variant: x 140, y 430, w 550–620, h 620–760;
- text start: x 820–900;
- image-right variant: text x 140–900, image x 1080–1700;
- align block titles and rules;
- preserve screenshot UI when it proves the channel.

**Content limit**

- 30–55 words per block;
- one image;
- no more than three blocks.

**Reject when:** the image does not prove the text or is visually treated as generic atmosphere.

For metric proof, target the metric object with a path such as `metrics[0]` and include both its visible value and label in the claim text.

## 6. Risk split

**Use for:** perception gap, cliché, shortcut or weak signal.

**Anatomy**

- title and framing sentence;
- one image with immediate shorthand;
- three stacked risks or stages;
- restrained warning accent;
- final sentence that states the consequence.

**Composition**

- image x 140, y 430, around 640 × 640 for a square or 560 × 720 for portrait;
- text x 920–980, y 430;
- each block separated by 35–60 px and a short rule;
- avoid red-alert styling.

**Content limit**

- 25–55 words per risk;
- final line 8–20 words.

**Reject when:** it insults the current work, exaggerates the problem, or relies on an unlicensed meme without replacement plan.

## 7. Opportunity shifts

**Use for:** two or three `from → to` changes.

### Variant A: vertical or diagonal progression

- large 01, 02, 03 numbers;
- each number, title and body forms one unit;
- units move across or down the canvas to create progression;
- one quote anchors the remaining negative space.

Suggested anchors:

- unit 1: x 140, y 430;
- unit 2: x 470, y 690;
- unit 3: x 950, y 950;
- quote: x 140, y 1080 when it does not collide.

### Variant B: aligned columns

Use the three-column grid when the copy lengths are similar and a diagonal would force collisions.

**Content limit**

- title: `From [A] to [B]`;
- body: 25–50 words;
- quote: 10–24 words.

**Reject when:** the `from` is a caricature, shifts are synonyms, or the page implies the company has no existing value.

## 8. Strategic equation

**Use for:** two forces resolving into one active promise.

**Anatomy**

- title and subtitle;
- two source-backed inputs;
- arrow, relation or tension marker;
- one synthesis block;
- one concluding sentence.

**Composition**

- input panels: around x 380 and 1060, y 470, w 480–560;
- synthesis: centered around x 740, y 760, w 520–600;
- conclusion: centered, max width 1100, y 1010–1110;
- use simple lines and flat fields, not dashboard cards.

**Content limit**

- each input 20–45 words;
- synthesis 4–12 words;
- conclusion 12–28 words.

**Reject when:** inputs are not comparable or the equation is decorative rather than explanatory.

## 9. Territory opener

**Use for:** first page of the retained strategic territory or a major act transition.

**Anatomy**

- platform phrase;
- one-line definition;
- territory, tension and promise;
- strongest real product, service, place or process proof;
- chapter label and marker.

**Composition**

- alternate background only when the documented regime uses chapter openers;
- text on left 48–55%;
- vertical or macro image on right 30–38%;
- keep the proof visually dominant but not full bleed by default.

**Content limit**

- three blocks of 25–50 words;
- one image.

**Reject when:** it repeats the platform page or uses a generic mood image instead of the code that makes the territory ownable.

## 10. Platform system

**Use for:** point of view, code, territory and tone around a central anchor.

**Anatomy**

- title and subtitle;
- platform phrase or real product/service anchor;
- four pillars;
- one concise signature.

**Composition**

- central anchor around x 900–1100, y 650–820;
- pillars occupy four quadrants or two aligned columns;
- allow one pillar per functional accent;
- keep paths and rules simple.

**Content limit**

- four pillars of 20–45 words;
- central phrase 2–7 words;
- signature 4–12 words.

**Reject when:** it becomes a SaaS feature grid, uses arbitrary icons or cannot be used to judge future creative work.

## 11. Communication system

**Use for:** proof ecosystem, channels, content roles or operational foundation.

**Anatomy**

- one central message, mark or object;
- four or five components around it;
- each component names a role and tangible proof;
- one system-level conclusion.

**Composition**

- use an asymmetric orbit, cross or 2 × 2 plus top layout;
- keep component blocks unframed;
- use consistent line icons only if the brand grammar supports them;
- conclusion across the lower center.

**Content limit**

- 20–45 words per component;
- maximum five components.

**Reject when:** components are generic services or promise more content rather than clearer proof.

## 12. Timeline or method

**Use for:** first action plan, creative method, rollout or phased work.

**Anatomy**

- horizontal rule or trajectory;
- three or four nodes;
- step title, explanation and deliverables;
- optional small source-derived illustration.

**Composition**

- line y 500–560;
- three-node centers around x 360, 1000, 1640;
- text columns below each node;
- use node size or color to establish progression;
- keep the last arrow within the outer margin.

**Content limit**

- three steps preferred;
- 25–50 words plus 3–6 deliverables per step;
- no detailed project plan.

**Reject when:** stages overlap, deliverables repeat or decorative gradients replace a clear sequence.

## 13. Route or film concept

**Use for:** one product, one route, one audience or one film tension.

**Anatomy**

- specific route title and one-line promise;
- main concept image;
- optional product cutout or real object;
- `Tension` and `Idea` blocks;
- final signature.

**Composition**

- image x 140, y 430, w 560–640, h 650–760;
- optional cutout may overlap the top edge by 40–100 px;
- text x 880–960, y 430;
- two blocks with functional rules;
- signature under the blocks.

**Content limit**

- tension 25–45 words;
- idea 50–80 words;
- signature 4–12 words;
- total route copy 80–120 words, hard review at 140.

**Reject when:** the route differs from adjacent routes only by product color, the concept image is generic, or two unresolved options remain joined by `/`.

## 14. Priority activation

**Use for:** the first recommended execution.

**Anatomy**

- title and recommendation sentence;
- three questions: why this move, why this subject, why now;
- one strong proof or concept image;
- optional chapter label.

**Composition**

- text-left/image-right or image-left/text-right;
- three stacked blocks on the text side;
- image occupies 30–42% of the canvas;
- alternate background may mark the start of the execution act.

**Content limit**

- 35–70 words per question;
- one image.

**Reject when:** the recommendation is unclear, the chosen route was not introduced, or production feasibility is ignored.

## 15. Storyboard or execution proof

**Use for:** storyboard, timeline, prototype, channel sequence or interface flow.

**Anatomy**

- title and one-line premise;
- 3–12 frames or execution states;
- frame number, timing, action and sound/caption;
- one approved local image per frame in final mode;
- final lockup state.

**Composition**

- 3–5 frames: one row or a deliberately asymmetric 2-row composition;
- 6 frames: one row only when captions remain readable, otherwise 3 × 2;
- 7–12 frames: two balanced rows with no more than six frames per row;
- gap 16–28 px;
- keep frame captions legible at full export size;
- use consistent aspect ratio;
- add no decorative motif behind small frames if it reduces clarity.

**Content limit**

- caption 3–16 words per frame;
- when a fixed duration is stated, every frame has a timecode and the timing must sum to that duration.

**Reject when:** the storyboard is a flattened unreadable screenshot, timing is missing, a final frame lacks a local image, an asset uses HTTP, or a placeholder frame remains. Text-only working frames are permitted only while `meta.stage` is `draft`.

## 16. Production

**Use for:** studio role and execution confidence.

**Anatomy**

- title and short signature;
- role, approach and strength;
- verified portrait or production proof;
- caption with name and role when applicable.

**Composition**

- text x 140–930;
- portrait or proof x 1080–1700, y 430–1120;
- keep portrait stable and unembellished;
- use bullet points sparingly within approach.

**Content limit**

- role 30–55 words;
- approach 4–6 bullets or 50–90 words;
- strength 25–50 words.

**Reject when:** it becomes a long studio profile, uses unsupported credentials or places the studio before the prospect's value.

## 17. References

**Use for:** verified work relevant to the proposed task.

**Anatomy**

- four entries in a 2 × 2 grid or two strong entries in two columns;
- number, project, deliverable, short description and relevance;
- optional small thumbnail or QR/link only when useful and verified.

**Composition**

- two columns starting x 140 and 1040;
- two rows around y 460 and 850;
- use rules, numbers or accents, not cards;
- keep the right motif from crossing body copy.

**Content limit**

- 30–55 words per entry;
- no more than four entries.

**Reject when:** relevance is missing, links are dead, projects are unverifiable or the page becomes a logo wall.

## 18. Thank-you

**Use for:** penultimate narrative page.

**Anatomy**

- `Merci` or source-appropriate title;
- short letter;
- truthful prospect attribution, plus studio attribution only when supplied;
- platform phrase;
- quiet return of the motif;
- optional discreet next step.

**Composition**

- letter width 850–1150 px;
- place it in the left or center-left region;
- use generous vertical spacing;
- keep motif strong enough to recall the cover but quiet enough for reading.

**Content limit**

- 110–180 words ideal;
- no new argument.

**Reject when:** it is a generic CTA, repeats the full dossier or uses a new visual language.

## 19. Final lockup

**Use for:** final page only.

**Anatomy**

- cover or final field;
- prospect mark, optional studio mark, and a quiet relationship label when the proposal is independent;
- strongest stable motif state;
- no running header, page number or paragraph.

**Composition**

- lockup slightly below or left of optical center when the motif occupies the right;
- preserve silence around the marks;
- close the same visual loop opened on page 1.

**Reject when:** it adds a new tagline, CTA, reference grid, contact block or unsupported claim, invents a missing studio identity, or leaves a blank studio slot.
