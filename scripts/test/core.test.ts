import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { isMainModule, sha256File } from "../src/core.js";

test("main-module detection resolves launcher symlinks", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-main-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const actualDirectory = path.join(temporary, "actual");
  const linkedDirectory = path.join(temporary, "linked");
  const actualScript = path.join(actualDirectory, "command.js");
  const linkedScript = path.join(linkedDirectory, "command.js");
  await mkdir(actualDirectory, { recursive: true });
  await mkdir(linkedDirectory, { recursive: true });
  await writeFile(actualScript, "", "utf8");
  await symlink(actualScript, linkedScript);

  const originalScript = process.argv[1];
  process.argv[1] = linkedScript;
  context.after(() => {
    if (originalScript === undefined) process.argv.splice(1, 1);
    else process.argv[1] = originalScript;
  });

  assert.equal(isMainModule(pathToFileURL(actualScript).href), true);
});

test("streaming file hash enforces an explicit byte ceiling", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-hash-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const filePath = path.join(temporary, "bytes.bin");
  await writeFile(filePath, "12345", "utf8");

  await assert.rejects(sha256File(filePath, 4), /safety limit/);
  assert.match(await sha256File(filePath, 5), /^[0-9a-f]{64}$/);
});
