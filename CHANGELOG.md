# Changelog

## 0.3.0, 2026-07-19

### Recurring Black Flower finishing masters

- Locks Production to the measured `PRODUCTION BLACKFLOWER` portrait master with exactly `Notre rôle`, `Notre approche` and `Notre force`.
- Requires an isolated portrait source, `contain` rendering, recorded source dimensions and a subject safe box so a flattened slide can never be used as a portrait again.
- Replaces the generic closing component with a three-to-four-paragraph `MERCI` letter, a returning prospect object or motif, and the fixed Black Flower signature block.
- Makes the final page a silent horizontal prospect-mark `×` Black Flower flower lockup with no header, pagination, legal copy or typed-logo fallback.
- Adds Chromium geometry tests for Production, Merci and the final lockup.

### Space and background discipline

- Adds explicit `stable` and `binary-chapter` background rhythms.
- Requires every Black Flower page to declare a `cover` or `body` field, keeps each field on one background token and closes on the exact cover token.
- Documents measured rails, occupancy bands, quiet-space rules and rejection criteria for interface-like residue.
- Keeps Production, optional References, Merci and the final lockup as separate pages.

### Film-route series and clean scaffolds

- Allows one contiguous series of two to four `film-concept` pages to repeat a compatible composition when the block contains every declared route and exactly matches `meta.creativeRouteCount`.
- Keeps adjacency checks at both series boundaries and the three-use ceiling for every occurrence outside the eligible block.
- Adds positive coverage for two, three and four-route masters, plus negative coverage for mismatched, fragmented, oversized, incompatible and overused series.
- Excludes transient `.test-input-*` directories from initialized jobs.
- Clarifies that job-specific `brand.ts`, `evidence.ts` and `deck.ts` files begin after research and page mapping instead of being seeded with false client content.

### Asset preparation

- Adds source dimensions and subject-safe-box metadata to image assets.
- Extends `prepare-logo` with an explicit `--matte-color '#RRGGBB'` workflow for monochrome marks on a uniform colored background.
- Records the color-matte inference method and requires edge inspection on light and dark fields.

## 0.2.0, 2026-07-18

### Black Flower profile

- Makes Black Flower Creative House the canonical creative author and BlackFlower the visible signature.
- Enforces a 15 to 20-page narrative with ordered diagnosis, platform, route, execution, production and closing beats.
- Requires 45 to 65 percent image-led pages, at least 60 percent real or documentary visual pages and no more than 40 percent generated visual pages.
- Requires six composition families, three visual peaks, no adjacent family repetition and three uses maximum per family.
- Binds composition metadata to compatible page types and proves distinct rendered geometry in Chromium.
- Blocks generic motifs, placeholder media, text-only creative routes and diagram-heavy fallback decks.
- Counts every page that renders substantive media in the documentary and generated source mix, regardless of declared visual intent.

### Evidence and rights

- Requires exact claim coverage for substantive visible fields.
- Detects blanket proposal classification and requires a grounded diagnostic claim mix.
- Blocks internal-only evidence from final dossiers and render reports.
- Keeps official origin separate from permission, rights status and distribution scope.
- Makes generated imagery forbidden in the public scaffold unless authorization is explicitly attributed and referenced.
- Carries the authorizer and durable generative-asset reference into the audited render report.
- Blocks generated assets from masquerading as evidence, exact products, identified people, screenshots, documents, archives or identities.
- Requires brand-truth and current-baseline pages to use registered real or documentary evidence media.

### Rendering and delivery

- Publishes a render only after a complete staging pass.
- Blocks external browser requests during capture.
- Verifies final font families and required weights in Chromium instead of silently accepting fallback fonts.
- Probes the fr-CH glyph repertoire and rejects every resolved fallback family, not only the dominant font.
- Adds text budgets and overflow coverage for dynamic lists, captions, contact details and production content.
- Binds source, hydrated assets, every PNG page, PDF and report with SHA-256 hashes.
- Reloads JSON, JavaScript and TypeScript sources independently and fails closed unless the loaded-dossier hash matches.
- Requires a complete render report plus a detached report checksum.
- Audits PNG geometry, sRGB opacity, PDF A4 geometry, page order and raster equivalence.

### Continuous validation

- Adds GitHub Actions checks for both TypeScript packages.
- Renders and audits both the neutral fixture and the Black Flower fixture in CI.
- Adds package dry runs and a private-source leakage scan.
