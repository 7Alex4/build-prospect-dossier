# Research and Evidence Standard

## Purpose

Build the dossier on a traceable evidence base. Keep current facts, visual observations, strategic interpretation, and creative proposals separate so persuasive writing never becomes fabricated fact.

## Table of contents

1. Input resolution
2. Research sequence
3. Source hierarchy
4. Evidence ledger
5. Claim map
6. Asset ledger and rights mode
7. Baseline capture
8. Fact and inference rules
9. Missing-input fallbacks
10. Completion standard

## 1. Input resolution

Begin with the company name and whatever the user supplied. Do not wait for a perfect brief.

Resolve identity in this order:

1. Exact official company or brand name.
2. Official domain and country.
3. Relevant product, service, collection, location, or business unit.
4. Likely decision-maker or audience.
5. User-supplied angle, film concepts, constraints, references, and desired outcome.

If several companies share the name, use the user's location, industry, URL, or provided assets to disambiguate. Only stop when the target cannot be identified responsibly.

Create `brief.yaml`:

```yaml
company: Example SA
brand: Example
product: null
framework_profile: black-flower
official_domain: https://example.com
country: CH
language: fr-CH
audience:
  - direction
  - marketing
user_angle: null
angle_status: open
user_film_ideas: []
target_pages: 18
desired_outcome: exploratory-meeting
distribution_mode: private-prospecting
relationship_status: independent-proposal
generative_assets: authorized
forbidden_client_terms: []
studio: Black Flower Creative House
studio_signature: BlackFlower
assumptions: []
constraints: []
```

Allowed `distribution_mode` values:

- `private-prospecting`: confidential one-to-one proposal to the prospect;
- `client-project`: work prepared under a mandate or explicit client approval;
- `public`: portfolio, open-source example, social post, event, repository or any other public distribution.

Allowed `relationship_status` values:

- `independent-proposal`: no mandate or partnership is implied;
- `client-approved`: the prospect approved preparation or presentation;
- `commissioned`: the dossier is produced under an active mandate.

Default to `private-prospecting` and `independent-proposal`. A later public release is a new rights decision, not an automatic extension of private prospecting use.

For Alex's Black Flower work, default `generative_assets` to `authorized` for creative projection and never for evidence. For outside open-source users, default to `forbidden` and change it only when explicitly authorized. Populate `forbidden_client_terms` from active project instructions, legal naming constraints or user preferences.

The Black Flower profile has a fixed studio identity: `Black Flower Creative House`, visible signature `BlackFlower`. Use job-local logo paths only when the mark is supplied and cleared. In an explicit neutral profile, studio identity is optional; do not invent a sender, mark, person, email, website or empty signature slot.

## 2. Research sequence

Research in passes. Do not start with broad inspiration searches.

### Pass A: official identity

- official website and localized domains;
- about, history, leadership, locations, careers, contact;
- official logo, press kit, brand resources, favicon and symbol;
- product or service architecture;
- official social accounts and current publishing rhythm.

### Pass B: present business moment

- current product launches, openings, ownership or leadership changes;
- recent official news and first-party interviews;
- current positioning and repeated phrases;
- market, hiring, partnership, investment, or transformation signals;
- dates and names that make `Why now?` defensible.

### Pass C: communication baseline

- homepage promise and information hierarchy;
- proof visible above and below the fold;
- image system, people, place, process, product, interface, material;
- social grid, recurring formats, gaps and inconsistencies;
- tone, language mix, typography, palette and motifs;
- whether communication matches the quality of the underlying offer.

### Pass D: heritage and distinctive codes

- origin story, founder, place, craft, material, process and product behavior;
- recognizable shapes, symbols, gestures, interfaces, sounds or rituals;
- archives and historical facts that can be verified;
- the most obvious category cliché and why it would weaken the brand.

### Pass E: context and references

- reputable trade coverage and interviews;
- category communication patterns;
- adjacent brands that solve a comparable communication problem;
- studio references that prove the required capability.

### Pass F: asset acquisition

- official vector logo;
- product or service images in the highest available resolution;
- official portraits and place/process images;
- screenshots captured at a known date;
- archives with source and date;
- licensed editorial or stock images only for a precise concept role.

## 3. Source hierarchy

| Tier | Source | Suitable use |
|---|---|---|
| A | Official site, press kit, regulatory filing, registry, annual material, first-party interview | Names, dates, products, locations, claims, official assets |
| B | Official social account, official video, official retailer or partner | Current activity, visual baseline, product and campaign proof |
| C | Reputable newspaper, trade publication, museum, institution, documented interview | Context, independent verification, history |
| D | Licensed stock or editorial library | Concept image with recorded license |
| E | Search result, aggregator, repost, Pinterest, anonymous blog | Discovery only, never final evidence |

Use primary sources for current brand facts. Use an independent source when a material claim benefits from confirmation. Never cite a search snippet.

## 4. Evidence ledger

Create `research/evidence.csv` with this header:

```csv
id,kind,claim,source_title,publisher,url,published_at,retrieved_at,source_tier,confidence,status,planned_pages,notes
```

Allowed `kind` values:

- `fact`: objectively checkable statement;
- `quote`: exact attributed words;
- `observation`: something visibly present in the company's communication;
- `interpretation`: strategic reading derived from facts or observations;
- `proposal`: the dossier's creative recommendation.

Allowed `status` values:

- `verified`: supported and ready for client-facing use;
- `official-only`: supported by a first-party source but not independently checked;
- `needs-check`: incomplete, ambiguous or possibly stale;
- `internal-only`: useful context that must not appear as fact;
- `rejected`: not reliable or not relevant.

Rules:

- Every page containing an external fact must list one or more evidence IDs in `strategy/page-map.md`.
- A quote requires an attributable source and exact wording. Otherwise paraphrase and label it as analysis.
- A strategic interpretation may be strong, but must be written as the proposal's reading, not as the company's declared intention.
- A creative platform, film, tagline, or campaign route is a proposal. Never imply that the prospect already adopted it.
- Record the retrieval date for web material because pages and leadership change.

## 5. Claim map

Page-level evidence is not precise enough. Create `research/claim-map.csv` with one row per client-facing factual, quoted, observational, interpretive or proposed statement:

```csv
claim_id,slide_id,content_path,kind,client_facing_text,evidence_ids,status,notes
```

Allowed `kind` values match the evidence ledger: `fact`, `quote`, `observation`, `interpretation`, `proposal`.

Allowed `status` values:

- `verified`: exact client-facing wording is supported and final;
- `qualified`: wording is deliberately attributed or limited;
- `proposal`: clearly presented as this dossier's recommendation;
- `remove`: must not appear in the dossier.

Rules:

- `fact`, `quote` and `observation` require one or more evidence IDs.
- `interpretation` must cite the facts or observations it derives from whenever available and must read as interpretation.
- `proposal` may have no external evidence, but must read as a recommendation rather than an adopted client decision.
- `content_path` is relative to the row's `slide_id`, for example `title`, `columns[0].body` or `metrics[0]`. Never use a deck path such as `slides[0].title` or `slides.3.metrics.0`.
- `content_path` must resolve to the exact client-visible target, not an ID, asset URL or other technical field.
- `client_facing_text` must match the final visible wording after Unicode, case and whitespace normalization. For `metrics[0]`, it must contain both the metric value and label. A vague topic label is insufficient.
- A page-level evidence list does not replace this file.
- Deleted or rewritten copy must be updated in the claim map before final rendering.
- In final mode, every substantive visible typed field must have a valid row and resolving typed claim. Draft mode may be incomplete, but every row already present must still resolve correctly.
- Classify each row from its meaning. Never label all fields `proposal` through a blanket transform to avoid evidence work or coverage failures.

The engine's typed `claims` metadata mirrors this map for render-time checks. The CSV remains the human-readable source of record.

## 6. Asset ledger and rights mode

Create `assets/asset-ledger.csv`:

```csv
id,file,role,subject,origin,url,creator,license,rights_basis,distribution_scope,status,captured_at,planned_pages,transformations,credit_required,notes
```

Allowed `status` values:

- `approved`: the documented rights basis covers the declared distribution scope;
- `reference-only`: may inform direction but may not ship;
- `unknown`: may not ship;
- `rejected`: do not use.

Allowed `distribution_scope` values:

- `private-prospecting`;
- `client-project`;
- `public`;
- `reference-only`;
- `none`.

Use `rights_basis` to record the actual basis, such as `user-authorization`, `explicit-license`, `press-terms`, `client-approval`, `rights-review`, or `none`. Do not write `fair use` or another legal conclusion unless a qualified review established it for the intended jurisdiction and use.

`origin` records where the file came from, such as `provided`, `official-site`, `press-kit`, `licensed-library`, `editorial`, `screenshot` or `studio-created`. Origin is not permission.

Important rights rules:

- `official` does not mean free to reuse.
- `provided` does not prove that the provider owns redistribution rights.
- a press-kit asset follows its published terms and intended context;
- a screenshot used as evidence and a photograph reused as decoration are different uses;
- a private proposal clearance does not authorize a public GitHub example;
- a public dossier may contain only assets cleared for that exact public distribution or original replacements created lawfully for it;
- logos and trademarks may identify the prospect, but must not imply endorsement, mandate or partnership;
- when the basis is uncertain, mark the file `reference-only` and replace it with a diagram, typographic page or cleared asset.

Record transformations such as crop, background removal, monochrome conversion, exposure correction and compositing. Never conceal the origin of an asset. This workflow records decisions but is not legal advice; obtain a rights review when the intended distribution or asset is sensitive.

Before implementation, mirror every shipping ledger row into the dossier's typed root `assets` registry. Preserve the same `id`; map `file` to the local `src` or provide the external row as `ledgerId`; map `origin`, `rights_basis`, `status` and every permitted shipping scope. An `ImageAsset.id` is the foreign key into this registry. The renderer derives usage from the theme and slide tree, so a hand-maintained page asset list cannot replace this mapping.

## 7. Baseline capture

Capture the prospect's communication as evidence, not as vague inspiration.

Minimum useful baseline:

- homepage at desktop width;
- relevant product, service or location page;
- recent social grid or six representative posts;
- one proof of people, process, place or product;
- one distinctive brand code;
- one visible communication gap;
- one current moment that can support `Why now?`, when a defensible event exists;
- otherwise one durable observed tension that can support `Why this matters` without false urgency.

For each screenshot record:

- URL;
- capture date;
- viewport or source dimensions;
- what the screenshot proves;
- whether interface chrome must remain visible.

Keep interface chrome when it proves the current channel. Remove it only when the image is being reused as a photographic asset and the license permits the crop.

## 8. Fact and inference rules

Use this wording discipline:

| Evidence class | Client-facing formulation |
|---|---|
| Verified fact | State directly and precisely |
| Official-only claim | Attribute or phrase conservatively |
| Observation | `Votre communication montre...`, `Nous observons...` |
| Interpretation | `Notre lecture est...`, `L'opportunité consiste à...` |
| Proposal | `Nous proposons...`, `La plateforme pourrait...` |
| Unknown | Omit from the dossier |

Do not use false precision. If no reliable market number exists, write the qualitative insight and omit the number.

Do not infer personal motives, financial performance, customer sentiment, product quality, sustainability, nationality, ownership or production origin from imagery alone.

## 9. Missing-input fallbacks

### No angle supplied

Research first. Generate three evidence-backed strategic shifts. Score them with `references/strategy-framework.md` and choose the strongest.

### No film supplied

Only add film routes if moving image is a credible first proof. Otherwise propose photography, editorial, product education, employer, website or social activation.

### No logo file supplied

Look for an official press kit or vector on the official domain. If unavailable, use the highest-quality official raster. Do not redraw a complex mark from a screenshot. Keep the original and disclose the limitation internally.

### No official imagery

Keep searching for current screenshots, product pages, archives, public places, materials and people. Use a precise licensed image or an authorized generated campaign scene for creative projection when appropriate. A diagram is allowed only for a real relation, sequence or quantity. It is not the default escape route. If the planned Black Flower image cadence cannot be met honestly, reduce the dossier or keep it in draft.

### Sparse company information

Narrow the claim. Build around observable communication, offer, place and product rather than inventing history or ambition.

### No defensible current event

Do not manufacture urgency. Replace `Why now?` with `Why this matters` and use a durable, observable tension, such as a gap between the offer and its visible proof. Label it as observation or interpretation according to the evidence.

### No distinctive brand object

Do not invent a pseudo-symbol. Use typography, a measured rule, a material cue or no persistent motif. Do not reach for a generic orbit, signal, grid or abstract line simply to occupy space.

### No studio references supplied

Omit the reference page or use only verified, user-provided references. Never create portfolio claims.

### No studio identity supplied

In the Black Flower profile, use the verified canonical name and text signature already defined by the framework. Do not invent a logo, portrait, person, email or website. In a neutral profile, omit unknown studio identity and record the omission in `brief.yaml`.

### Conflicting sources

Prefer the newest authoritative source, record the conflict, and omit the claim if it cannot be resolved.

## 10. Completion standard

Research is complete when:

- the target company is unambiguous;
- a defensible current moment or durable observed tension is supported;
- the communication baseline has visible proof;
- at least one distinctive brand truth is documented;
- the obvious creative shortcut is identifiable;
- every client-facing claim has a claim-map row and the required evidence IDs;
- every planned final substantive visible field has an exact slide-relative `content_path` and matching final wording;
- no blanket `proposal` classification hides facts, observations or interpretations;
- every shipping asset is cleared for the declared distribution mode;
- the cover and final relationship wording matches the declared relationship status;
- the Black Flower image plan lands between 45% and 65% image-led pages and includes enough cleared concrete media to execute it;
- unresolved uncertainty is either removed from client copy or clearly framed as a proposal.
