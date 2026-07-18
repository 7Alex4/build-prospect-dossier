import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { initProject } from "../src/project-scaffold.js";

async function exists(filePath: string): Promise<boolean> {
  return stat(filePath).then(() => true, () => false);
}

test("init project copies the engine, ignores generated files and creates workflow structure", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-init-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const template = path.join(temporary, "engine");
  const target = path.join(temporary, "job");
  await mkdir(path.join(template, "src"), { recursive: true });
  await mkdir(path.join(template, "node_modules", "package"), { recursive: true });
  await mkdir(path.join(template, "dist"), { recursive: true });
  await mkdir(path.join(template, "rendered", "slides"), { recursive: true });
  await writeFile(path.join(template, "package.json"), '{"name":"engine"}\n', "utf8");
  await writeFile(path.join(template, "src", "index.ts"), "export const engine = true;\n", "utf8");
  await writeFile(path.join(template, "node_modules", "package", "secret"), "ignored", "utf8");
  await writeFile(path.join(template, "dist", "bundle.js"), "ignored", "utf8");
  await writeFile(path.join(template, "rendered", "slides", "01.png"), "ignored", "utf8");

  const result = await initProject({ targetDirectory: target, templateDirectory: template });

  assert.equal(result.copiedTemplateFiles, 2);
  assert.equal(await exists(path.join(target, "src", "index.ts")), true);
  assert.equal(await exists(path.join(target, "node_modules")), false);
  assert.equal(await exists(path.join(target, "dist")), false);
  assert.equal(await exists(path.join(target, "rendered")), false);
  for (const required of [
    "brief.yaml",
    "research/evidence.csv",
    "research/claim-map.csv",
    "research/observations.md",
    "research/source-notes.md",
    "assets/raw",
    "assets/processed",
    "assets/asset-ledger.csv",
    "strategy/diagnosis.md",
    "strategy/platform.md",
    "strategy/page-map.md",
    "qa/report.md",
    "output/slides",
  ]) {
    assert.equal(await exists(path.join(target, required)), true, required);
  }
  const brief = await readFile(path.join(target, "brief.yaml"), "utf8");
  for (const field of [
    "company",
    "brand",
    "product",
    "framework_profile",
    "official_domain",
    "country",
    "language",
    "audience",
    "user_angle",
    "user_film_ideas",
    "angle_status",
    "stage",
    "target_pages",
    "desired_outcome",
    "distribution_mode",
    "relationship_status",
    "generative_assets",
    "studio",
    "studio_signature",
    "assumptions",
    "constraints",
    "forbidden_client_terms",
  ]) {
    assert.match(brief, new RegExp(`^${field}:`, "m"), field);
  }
  assert.match(brief, /^angle_status: open$/m);
  assert.match(brief, /^stage: draft$/m);
  assert.match(brief, /^distribution_mode: private-prospecting$/m);
  assert.match(brief, /^relationship_status: independent-proposal$/m);
  assert.match(brief, /^framework_profile: black-flower$/m);
  assert.match(brief, /^generative_assets: authorized$/m);
  assert.match(brief, /^studio: Black Flower Creative House$/m);
  assert.match(brief, /^studio_signature: BlackFlower$/m);
  assert.match(brief, /^forbidden_client_terms: \[\]$/m);
  assert.equal(
    await readFile(path.join(target, "research", "evidence.csv"), "utf8"),
    "id,kind,claim,source_title,publisher,url,published_at,retrieved_at,source_tier,confidence,status,planned_pages,notes\n",
  );
  assert.equal(
    await readFile(path.join(target, "research", "claim-map.csv"), "utf8"),
    "claim_id,slide_id,content_path,kind,client_facing_text,evidence_ids,status,notes\n",
  );
  assert.equal(
    await readFile(path.join(target, "assets", "asset-ledger.csv"), "utf8"),
    "id,file,role,subject,origin,url,creator,license,rights_basis,distribution_scope,status,captured_at,planned_pages,transformations,credit_required,notes\n",
  );
  const pageMap = await readFile(path.join(target, "strategy", "page-map.md"), "utf8");
  for (const contractField of [
    "Slide ID",
    "Family",
    "Purpose",
    "Takeaway",
    "Evidence IDs",
    "Claim IDs and content paths",
    "Asset ID",
    "Proof function",
    "Visual intent",
    "Visual-intent rationale",
    "Composition family",
    "Visual peak",
    "Transition in",
    "Transition out",
    "Unanswered question",
    "Copy risk",
  ]) {
    assert.match(pageMap, new RegExp(contractField), contractField);
  }
  assert.equal(
    await readFile(path.join(target, "qa", "report.md"), "utf8"),
    `# Dossier QA

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
- reference-only excluded:

## Visual review

- pages inspected at 100%:
- contact sheet inspected:
- contact sheet inspected at 25%:
- distinct silhouettes:
- visible peaks:
- logo-hidden prospect recognition:
- 375 px preview:
- 1440 px preview:

## Corrections made

1.

## Disclosed limitations

- Pending review.
`,
  );
  assert.equal(await exists(path.join(target, "research", "observations", "source-notes.md")), false);
});

test("init project refuses non-empty targets unless force is explicit and preserves workflow notes", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-init-force-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const template = path.join(temporary, "engine");
  const target = path.join(temporary, "job");
  await mkdir(template, { recursive: true });
  await mkdir(target, { recursive: true });
  await writeFile(path.join(template, "package.json"), '{"name":"engine"}\n', "utf8");
  await writeFile(path.join(target, "brief.yaml"), "company: Acme\n", "utf8");

  await assert.rejects(initProject({ targetDirectory: target, templateDirectory: template }), /not empty/);
  await initProject({ targetDirectory: target, templateDirectory: template, force: true });
  assert.equal(await readFile(path.join(target, "brief.yaml"), "utf8"), "company: Acme\n");
});

test("init project force refuses destination symlinks and preserves outside files", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-init-symlink-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const template = path.join(temporary, "engine");
  const target = path.join(temporary, "job");
  const outside = path.join(temporary, "outside.txt");
  await mkdir(template, { recursive: true });
  await mkdir(target, { recursive: true });
  await writeFile(path.join(template, "package.json"), '{"name":"engine"}\n', "utf8");
  await writeFile(outside, "preserve me\n", "utf8");
  await symlink(outside, path.join(target, "package.json"));

  await assert.rejects(
    initProject({ targetDirectory: target, templateDirectory: template, force: true }),
    /Symbolic links are forbidden/,
  );
  assert.equal(await readFile(outside, "utf8"), "preserve me\n");
});

test("init project rejects overlapping template and target trees", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-init-overlap-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const template = path.join(temporary, "engine");
  await mkdir(template, { recursive: true });
  await writeFile(path.join(template, "package.json"), '{"name":"engine"}\n', "utf8");

  await assert.rejects(
    initProject({ targetDirectory: path.join(template, "nested-job"), templateDirectory: template }),
    /non-overlapping directories/,
  );
  await assert.rejects(
    initProject({ targetDirectory: path.join(template, "..target"), templateDirectory: template }),
    /non-overlapping directories/,
  );
  await assert.rejects(
    initProject({ targetDirectory: temporary, templateDirectory: template, force: true }),
    /non-overlapping directories/,
  );
});
