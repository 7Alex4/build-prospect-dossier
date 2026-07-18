import { constants } from "node:fs";
import { access, copyFile, lstat, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { naturalCompare, UserInputError } from "./core.js";
import { assertLinkFree, assertTreesDoNotOverlap } from "./project-path-safety.js";
import {
  createWorkflowFiles,
  type GenerativeAssetAuthorization,
  type ScaffoldProfile,
} from "./project-workflow-files.js";

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

export interface InitProjectOptions {
  readonly targetDirectory: string;
  readonly templateDirectory: string;
  readonly force?: boolean;
  readonly generativeAssetAuthorization?: GenerativeAssetAuthorization;
  readonly profile?: ScaffoldProfile;
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
  profile: ScaffoldProfile,
  authorization?: GenerativeAssetAuthorization,
): Promise<{ created: string[]; preserved: string[] }> {
  const created: string[] = [];
  const preserved: string[] = [];
  for (const [relativePath, content] of Object.entries(createWorkflowFiles(profile, authorization))) {
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
  const authorization = options.generativeAssetAuthorization;
  const profile = options.profile ?? "neutral";
  if (profile !== "neutral" && profile !== "black-flower") {
    throw new UserInputError("Project profile must be neutral or black-flower.");
  }
  if (authorization !== undefined
    && (typeof authorization.authorizedBy !== "string"
      || typeof authorization.reference !== "string"
      || authorization.authorizedBy.trim().length === 0
      || authorization.reference.trim().length === 0)) {
    throw new UserInputError("Generative asset authorization requires a non-empty authorizer and reference.");
  }
  const targetStat = await lstat(target).catch(() => undefined);
  if (targetStat?.isSymbolicLink()) {
    throw new UserInputError(`Project target cannot be a symbolic link: ${target}`);
  }
  if (await directoryIsNonEmpty(target) && options.force !== true) {
    throw new UserInputError("Project target is not empty. Choose an empty directory or explicitly pass --force.");
  }
  await mkdir(target, { recursive: true });
  const copiedTemplateFiles = await copyTemplate(template, target, target);
  const workflow = await writeWorkflowFiles(target, profile, authorization);
  return {
    targetDirectory: target,
    copiedTemplateFiles,
    createdWorkflowFiles: workflow.created,
    preservedWorkflowFiles: workflow.preserved,
  };
}
