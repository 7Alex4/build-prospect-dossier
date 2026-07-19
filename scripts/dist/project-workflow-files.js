function yamlString(value) {
    return JSON.stringify(value.trim());
}
function briefFile(profile, authorization) {
    const authorized = authorization !== undefined;
    return `company: ""
brand: ""
product: null
framework_profile: ${profile}
official_domain: ""
country: null
language: fr-CH
audience: []
user_angle: null
user_film_ideas: []
angle_status: open
stage: draft
target_pages: 18
desired_outcome: exploratory-meeting
distribution_mode: private-prospecting
relationship_status: independent-proposal
background_rhythm: stable
generative_assets: ${authorized ? "authorized" : "forbidden"}
generative_assets_authorization:
  status: ${authorized ? "explicitly-authorized" : "not-authorized"}
  authorized_by: ${authorized ? yamlString(authorization.authorizedBy) : "null"}
  reference: ${authorized ? yamlString(authorization.reference) : "null"}
studio: ${profile === "black-flower" ? "Black Flower Creative House" : "null"}
studio_signature: ${profile === "black-flower" ? "BlackFlower" : "null"}
assumptions: []
constraints: []
forbidden_client_terms: []
`;
}
const RESEARCH_FILES = {
    "research/evidence.csv": "id,kind,claim,source_title,publisher,url,published_at,retrieved_at,source_tier,confidence,status,planned_pages,notes\n",
    "research/claim-map.csv": "claim_id,slide_id,content_path,kind,client_facing_text,evidence_ids,status,notes\n",
    "research/observations.md": `# Observations

Record visible signals separately from interpretations. Link each usable observation to an evidence ID.
`,
    "research/source-notes.md": `# Source notes

For each source, record what it proves, what it does not prove, retrieval context, and reuse constraints.
`,
    "assets/asset-ledger.csv": "id,file,role,subject,origin,url,creator,license,rights_basis,distribution_scope,status,captured_at,planned_pages,source_width,source_height,subject_safe_box,transformations,credit_required,notes\n",
};
const STRATEGY_FILES = {
    "strategy/diagnosis.md": `# Diagnosis

## Observed situation

## Commercial tension

## Opportunity

## Evidence boundaries
`,
    "strategy/platform.md": `# Creative platform

## Core proposition

## Narrative spine

## Visual principle

## Film system

## Proof system
`,
    "strategy/page-map.md": `# Page map

Duplicate this complete page contract for every planned slide.

## 01: Working title

- Slide ID: S01
- Family:
- Act:
- Purpose:
- Takeaway:
- Evidence IDs:
- Claim IDs and content paths:
  - Claim ID:
  - Content path:
  - Kind:
- Content blocks:
  1.
- Media role:
- Asset ID:
- Proof function:
- Visual intent: image-led | image-supported | typographic | diagram
- Visual-intent rationale:
- Composition family:
- Visual peak: yes | no
- Counts as argumentative media: yes | no
- Background field: cover | body
- Motif state:
- Transition in:
- Transition out:
- Unanswered question:
- Copy risk:
- Status: planned
`,
};
const QA_FILE = `# Dossier QA

- Company:
- Platform:
- Pages:
- Rendered at:
- Overall score: PENDING
- Hard failures: PENDING

## Commands

- type-check: PENDING
- build: PENDING
- validate: PENDING
- render: PENDING
- audit: PENDING

## Evidence

- facts checked:
- unresolved facts removed:

## Assets

- shipping assets:
- image-led pages and ratio:
- real/documentary visual pages and ratio:
- generated visual pages and ratio:
- diagram pages:
- provided:
- official:
- licensed:
- generated with explicit authorization:
- authorization reference checked:
- reference-only excluded:

## Visual review

- pages inspected at 100%:
- contact sheet inspected:
- contact sheet inspected at 25%:
- distinct silhouettes:
- visible peaks:
- background rhythm and transition count:
- Production master geometry:
- Merci master geometry:
- silent final lockup geometry:
- logo-hidden prospect recognition:
- 375 px preview:
- 1440 px preview:

## Corrections made

1.

## Disclosed limitations

- Pending review.
`;
export function createWorkflowFiles(profile = "neutral", authorization) {
    return {
        "brief.yaml": briefFile(profile, authorization),
        ...RESEARCH_FILES,
        ...STRATEGY_FILES,
        "qa/report.md": QA_FILE,
    };
}
//# sourceMappingURL=project-workflow-files.js.map