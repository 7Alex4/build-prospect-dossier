import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { UserInputError } from "./core.js";

function contained(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === ""
    || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

async function canonicalPotentialPath(input: string): Promise<string> {
  let current = path.resolve(input);
  const suffix: string[] = [];
  while (true) {
    const resolved = await realpath(current).catch(() => undefined);
    if (resolved !== undefined) return path.join(resolved, ...suffix);
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(input);
    suffix.unshift(path.basename(current));
    current = parent;
  }
}

export async function assertTreesDoNotOverlap(template: string, target: string): Promise<void> {
  const [canonicalTemplate, canonicalTarget] = await Promise.all([
    canonicalPotentialPath(template),
    canonicalPotentialPath(target),
  ]);
  if (contained(canonicalTemplate, canonicalTarget) || contained(canonicalTarget, canonicalTemplate)) {
    throw new UserInputError("Template and project target must be separate non-overlapping directories.");
  }
}

export async function assertLinkFree(root: string, candidate: string): Promise<void> {
  const relative = path.relative(root, candidate);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new UserInputError(`Destination escapes the project target: ${candidate}`);
  }
  let current = root;
  for (const segment of relative.split(path.sep).filter((value) => value.length > 0)) {
    current = path.join(current, segment);
    const currentStat = await lstat(current).catch(() => undefined);
    if (currentStat?.isSymbolicLink()) {
      throw new UserInputError(`Symbolic links are forbidden in the project target: ${current}`);
    }
  }
}
