# Image Direction

## Purpose

Choose images as evidence and narrative instruments. Every image must answer `Why this image on this page?` with something stronger than mood.

## Table of contents

1. Image roles
2. Acquisition ladder
3. Page image brief
4. Selection score
5. Role-specific rules
6. Treatment and processing
7. Generative imagery policy
8. Rejection criteria

## 1. Image roles

Assign exactly one primary role to every image.

| Role | Function | Typical source |
|---|---|---|
| Baseline proof | Show current communication or product reality | Official website or social screenshot |
| Capability proof | Make people, process, place, interface or production tangible | Official press or provided asset |
| Heritage proof | Support a historical or distinctive code | Verified archive or institution |
| Product proof | Show the exact object or feature discussed | Official packshot, macro or screenshot |
| Human proof | Give a verified person and role presence | Official portrait or provided portrait |
| Concept scene | Dramatize a specific tension or route | Licensed editorial/stock, provided still or authorized generated scene |
| Cultural shorthand | Make a risk or familiar behavior instantly legible | Properly licensed or reference-cleared cultural image |
| Sequence proof | Show timing, mechanism or execution detail | Storyboard, prototype, wireframe or frame strip |
| Studio proof | Demonstrate relevant prior capability or Black Flower production presence | Verified studio project asset or approved portrait |

Do not assign `decoration` as a role.

## 2. Acquisition ladder

Use sources in this discovery order, then clear each retained asset for the declared distribution mode. Position in the ladder does not grant permission:

1. User-provided original.
2. Official client press, product, newsroom or brand asset.
3. Official social or video asset with recorded URL and date.
4. Public institution, museum or documented archive.
5. Licensed editorial or stock image.
6. Authorized generated campaign scene, film territory, moodboard or storyboard.
7. Original Black Flower drawing, collage or material experiment.
8. A diagram only when it explains a real relation, sequence or quantity better than an image and a sentence.

Keep the highest-resolution original in `assets/raw/`. Put processed derivatives in `assets/processed/`. Record provenance, rights basis and distribution scope separately.

Never download a search thumbnail as the final asset. Never use Pinterest or a repost as provenance.

## 3. Page image brief

Before searching, write one entry per media page:

```markdown
## Page 07: Risk

- Claim to prove: the category's obvious visual shortcut erases the brand's real method
- Role: cultural shorthand
- Subject: familiar category scene with a visibly predictable composition
- Required action or detail: the cliché must be readable at contact-sheet size
- Orientation: vertical 4:5 or near-square
- Crop: subject centered with quiet edges for an editorial crop
- Tonal need: low saturation, compatible with warm paper field
- Source class: licensed editorial or stock
- Reject: generic beauty shot, illegible metaphor, AI artifacts, watermarks
- Asset ID: pending
```

Search for the subject and action, not for adjectives such as `premium`, `cinematic` or `luxury` alone.

In `strategy/page-map.md`, also record the page's `visualIntent`, composition family and whether the image counts as argumentative media. Plan the entire contact sheet before layout. A Black Flower dossier must land between 45% and 65% image-led pages, target 55%.

## 4. Selection score

Score candidate images from 0 to 5.

| Criterion | Question | Weight |
|---|---|---:|
| Proof | Does it visibly support the page claim? | 3 |
| Specificity | Could it belong to this prospect or exact concept? | 3 |
| Legibility | Is the subject clear at contact-sheet size? | 2 |
| Composition | Can it fit the required crop without damage? | 2 |
| Tonal fit | Does it coexist with the brand grammar? | 1 |
| Resolution | Is it sharp enough at final size? | 2 |
| Rights | Are origin, rights basis and permitted distribution scope documented? | 3 |
| Distinctiveness | Does it avoid category stock clichés? | 2 |

Reject any candidate scoring below 3 on Proof, Specificity, Resolution or Rights.

Save the retained image and at most two alternates. Record why the winner was selected.

## 5. Role-specific rules

### Baseline screenshots

- Capture the real current state.
- Keep browser or social UI when it proves channel context.
- Use a capture date.
- Highlight only with restrained crops or annotations.
- Do not mock a stronger current state than the company actually has.

### Product and service proof

- Use the exact product, model, interface, place or service step named in copy.
- Prefer official packshots for cutouts.
- Verify color, variant, model name and orientation.
- Preserve material edges and reflections.
- Do not stretch a portrait screenshot into a panoramic image.

### People

- Verify name, title and current role before captioning.
- Prefer natural, well-lit, source-approved portraits.
- Do not infer identity from an uncaptioned group photograph.
- Do not over-retouch skin or replace a real person with a synthetic portrait.

### Archive and history

- Record date, event, source and caption.
- Keep visible historical context when useful.
- Avoid presenting an archive inference as a confirmed story.
- Do not colorize or alter documentary material without a disclosed reason.

### Concept scenes

The scene must contain:

- a specific person, object or environment;
- a readable pressure, choice, contrast or gesture;
- enough visual space for the proposed crop;
- no unrelated category cliché;
- a relationship to a real brand code.

A beautiful empty room is not a concept unless absence, scale, silence or architecture is the actual tension.

### Cultural shorthand and memes

Use rarely. A cultural image may clarify a risk, boredom, predictability or familiar behavior, but it carries legal and tonal risk.

- Document the basis for the exact private use; do not assume that public visibility grants private reuse rights.
- For public distribution, use an owned, explicitly authorized, licensed or public-domain alternative whose terms cover the planned publication.
- Never build the full art direction around a borrowed character or meme.
- Ensure the shorthand does not mock the prospect or its customers.
- Keep a replacement path in the asset ledger.

### Studio references

- Select references by relevance to the prospect's need.
- State what was delivered and why it matters here.
- Use only projects the studio can substantiate.
- Prefer one clear thumbnail or direct proof over a wall of logos.
- A production page requires a real approved Black Flower portrait or verifiable production proof. A generic biography block does not replace it.

### Storyboards

- Use supplied or newly drawn frames, not screenshots of an unreadable full page.
- Include shot, action, sound and timing.
- Keep a consistent aspect ratio.
- Verify that stated durations sum correctly.
- Use placeholder frames only when clearly marked in working material, never in the client-ready export.

## 6. Treatment and processing

### Cropping

- Crop for the claim, not merely for visual balance.
- Keep faces, products, labels and key gestures intact.
- Do not crop official marks into ambiguity.
- Reuse a stable crop family across related route pages.

### Background removal

- Preserve the raw original.
- Use a clean alpha channel.
- Inspect edges at 200%, especially metal, hair, glass and white objects.
- Remove color spill and halos.
- Test on both light and dark fields.

### Color correction

- Correct exposure, white balance and consistency.
- Avoid cinematic grading that changes product color or documentary meaning.
- Do not force every image into monochrome unless the brand grammar requires it.

### Framing

- Prefer unframed images or one quiet consistent radius.
- Avoid device mockups, drop shadows and glass cards unless the source brand uses them.
- Let product cutouts overlap only when the relation is meaningful and edges remain clean.
- Set media presentation explicitly: `frame` for photographic fields, `cutout` for transparent products, `background` only for a true full-field scene.
- For a route, use a licensed or generated `frame` scene plus the exact approved `cutout` product. Keep the cutout on `contain`, allow visible overflow and overlap roughly 4–10% of the canvas width.

### Diagrams and illustrations

- Use them only when a real system, relation, sequence or quantity is clearer than a photograph and a sentence.
- Derive line, number and icon language from the current brand.
- Keep icons consistent in stroke and scale.
- Do not use random icon libraries to fill space.
- In the Black Flower profile, use no more than two primarily diagrammatic pages.
- Never use a diagram as the main visual for a risk, creative route, priority activation or production page.

## 7. Generative imagery policy

Alex's Black Flower owner brief authorizes generative imagery for creative projection, but each dossier must record the authorizer and durable reference. The profile name alone grants nothing. Neutral open-source default: no generative imagery without explicit authorization.

Use generative imagery only when the user explicitly authorizes it and when no real, official, licensed or designed alternative can achieve the necessary concept. If authorized:

- record the model, prompt, date and output path;
- disclose synthetic origin in the asset ledger;
- do not generate real people, products, logos, facilities or historical events as purported evidence;
- do not imitate a living artist or identifiable campaign;
- inspect hands, text, reflections, geometry, product accuracy and brand marks;
- use the image as concept material, never as documentary proof;
- keep a human-review flag before client delivery.

For Black Flower campaign work:

- generate scenes, routes, moodboards and storyboard frames, never complete slide layouts;
- if an exact product must appear, generate the world first and composite the real approved product cutout;
- keep generated visual pages at or below 40%;
- lock casting, lens, light, grain and palette across a sequence;
- reject synthetic beauty that performs no narrative work.

## 8. Rejection criteria

Reject an image when:

- provenance or reuse status is unknown;
- it contains a watermark or search interface;
- it is only generic atmosphere;
- it contradicts the exact product, place, date or claim;
- its subject is unreadable at the intended size;
- it needs severe enlargement or destructive crop;
- it repeats the same visual role as adjacent pages;
- it imports generic luxury or technology codes unsupported by the company;
- it looks synthetic when the brief requests non-generative imagery;
- it depicts a person whose identity or role is uncertain;
- it creates legal, reputational or cultural risk disproportionate to its value;
- it exists mainly to decorate a card, grid, arrow system or pseudo-interface;
- it cannot remain recognizable and useful at contact-sheet size;
- another generic image could replace it without changing the argument.
