import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { INIT_PROJECT_HELP } from "../src/init-project.js";
import { initProject } from "../src/project-scaffold.js";

async function exists(filePath: string): Promise<boolean> {
  return stat(filePath).then(() => true, () => false);
}

test("init project never copies transient test-input directories", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-init-policy-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const template = path.join(temporary, "engine");
  const target = path.join(temporary, "job");
  await mkdir(path.join(template, ".test-input-root"), { recursive: true });
  await mkdir(path.join(template, "src", ".test-input-nested"), { recursive: true });
  await writeFile(path.join(template, "package.json"), '{"name":"engine"}\n', "utf8");
  await writeFile(path.join(template, ".test-input-root", "secret.txt"), "ignored\n", "utf8");
  await writeFile(path.join(template, "src", ".test-input-nested", "secret.txt"), "ignored\n", "utf8");

  const result = await initProject({ targetDirectory: target, templateDirectory: template });

  assert.equal(result.copiedTemplateFiles, 1);
  assert.equal(await exists(path.join(target, ".test-input-root")), false);
  assert.equal(await exists(path.join(target, "src", ".test-input-nested")), false);
});

test("initializer and documentation distinguish scaffold files from authored content", async () => {
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const skill = await readFile(path.join(repositoryRoot, "SKILL.md"), "utf8");
  const workflow = await readFile(path.join(repositoryRoot, "references", "production-workflow.md"), "utf8");
  const contract = /does not create `brand\.ts`, `evidence\.ts` or `deck\.ts`/;

  assert.match(INIT_PROJECT_HELP, /does not create brand\.ts, evidence\.ts or deck\.ts/);
  assert.match(skill, contract);
  assert.match(workflow, contract);
});
