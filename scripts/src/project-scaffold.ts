import { constants } from "node:fs";
import { access, copyFile, lstat, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { naturalCompare, UserInputError } from "./core.js";
import { assertLinkFree, assertTreesDoNotOverlap } from "./project-path-safety.js";

const IGNORED_NAMES = new Set([
  ".cache",
  ".git",
  ".next",
  ".playwright-browsers",
  ".turbo",
  ".vite",
  ".vite-temp",
  "__pycache__",
  "cache",
  "caches",
  "coverage",
  "dist",
  "node_modules",
]);

const SCAFFOLD_FILES: Readonly<Record<string, string>> = {
  "brief.yaml": `company: ""
brand: ""
product: null
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
generative_assets: forbidden
studio: null
assumptions: []
constraints: []
forbidden_client_terms: []
`,
  "research/evidence.csv": "id,kind,claim,source_title,publisher,url,published_at,retrieved_at,source_tier,confidence,status,planned_pages,notes\n",
  "research/claim-map.csv": "claim_id,slide_id,content_path,kind,client_facing_text,evidence_ids,status,notes\n",
  "research/observations.md": `# Observations

Record visible signals separately from interpretations. Link each usable observation to an evidence ID.
`,
  "research/source-notes.md": `# Source notes

For each source, record what it proves, what it does not prove, retrieval context, and reuse constraints.
`,
  "assets/asset-ledger.csv": "id,file,role,subject,origin,url,creator,license,rights_basis,distribution_scope,status,captured_at,planned_pages,transformations,credit_required,notes\n",
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
- Background mode:
- Motif state:
- Transition in:
- Transition out:
- Unanswered question:
- Copy risk:
- Status: planned
`,
  "qa/report.md": `# Dossier QA

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

- Pending review.
`,
};

export interface InitProjectOptions {
  readonly targetDirectory: string;
  readonly templateDirectory: string;
  readonly force?: boolean;
}

export interface InitProjectResult {
  readonly targetDirectory: string;
  readonly copiedTemplateFiles: number;
  readonly createdWorkflowFiles: readonly string[];
  readonly preservedWorkflowFiles: readonly string[];
}

function ignored(name: string): boolean {
  return IGNORED_NAMES.has(name) || name === "rendered" || name.startsWith("rendered-");
}

async function directoryIsNonEmpty(directory: string): Promise<boolean> {
  const directoryStat = await stat(directory).catch(() => undefined);
  if (directoryStat === undefined) {
    return false;
  }
  if (!directoryStat.isDirectory()) {
    throw new UserInputError(`Project target is not a directory: ${directory}`);
  }
  return (await readdir(directory)).length > 0;
}

async function copyTemplate(source: string, destination: string, targetRoot: string): Promise<number> {
  let copied = 0;
  const entries = await readdir(source, { withFileTypes: true });
  entries.sort((left, right) => naturalCompare(left.name, right.name));
  for (const entry of entries) {
    if (ignored(entry.name)) {
      continue;
    }
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    await assertLinkFree(targetRoot, destinationPath);
    if (entry.isDirectory()) {
      await mkdir(destinationPath, { recursive: true });
      copied += await copyTemplate(sourcePath, destinationPath, targetRoot);
    } else if (entry.isFile()) {
      await mkdir(path.dirname(destinationPath), { recursive: true });
      await copyFile(sourcePath, destinationPath);
      copied += 1;
    }
  }
  return copied;
}

async function writeWorkflowFiles(
  target: string,
): Promise<{ created: string[]; preserved: string[] }> {
  const created: string[] = [];
  const preserved: string[] = [];
  for (const [relativePath, content] of Object.entries(SCAFFOLD_FILES)) {
    const destination = path.join(target, relativePath);
    await assertLinkFree(target, destination);
    await mkdir(path.dirname(destination), { recursive: true });
    try {
      await writeFile(destination, content, { encoding: "utf8", flag: "wx" });
      created.push(relativePath);
    } catch (error) {
      const code = error instanceof Error && "code" in error ? error.code : undefined;
      if (code !== "EEXIST") {
        throw error;
      }
      preserved.push(relativePath);
    }
  }
  for (const directory of ["assets/raw", "assets/processed", "output/slides"]) {
    const destination = path.join(target, directory);
    await assertLinkFree(target, destination);
    await mkdir(destination, { recursive: true });
  }
  return { created, preserved };
}

export async function initProject(options: InitProjectOptions): Promise<InitProjectResult> {
  const target = path.resolve(options.targetDirectory);
  const template = path.resolve(options.templateDirectory);
  await assertTreesDoNotOverlap(template, target);
  const templateStat = await stat(template).catch(() => undefined);
  if (templateStat === undefined || !templateStat.isDirectory()) {
    throw new UserInputError(`Dossier engine template is not a readable directory: ${options.templateDirectory}`);
  }
  await access(path.join(template, "package.json"), constants.R_OK).catch(() => {
    throw new UserInputError(`Template does not contain a readable package.json: ${template}`);
  });
  const targetStat = await lstat(target).catch(() => undefined);
  if (targetStat?.isSymbolicLink()) {
    throw new UserInputError(`Project target cannot be a symbolic link: ${target}`);
  }
  if (await directoryIsNonEmpty(target) && options.force !== true) {
    throw new UserInputError("Project target is not empty. Choose an empty directory or explicitly pass --force.");
  }
  await mkdir(target, { recursive: true });
  const copiedTemplateFiles = await copyTemplate(template, target, target);
  const workflow = await writeWorkflowFiles(target);
  return {
    targetDirectory: target,
    copiedTemplateFiles,
    createdWorkflowFiles: workflow.created,
    preservedWorkflowFiles: workflow.preserved,
  };
}
