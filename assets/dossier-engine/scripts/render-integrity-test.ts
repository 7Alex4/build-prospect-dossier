import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import { join } from "node:path";
import {
  cleanupRenderWorkspace,
  prepareRenderWorkspace,
  publishRenderWorkspace,
  type RenderWorkspace,
} from "./lib/render-output";
import { isAllowedRenderRequest, isAllowedRenderSocket } from "./lib/render-security";

async function exists(filePath: string): Promise<boolean> {
  return (await stat(filePath).catch(() => undefined)) !== undefined;
}

async function populate(workspace: RenderWorkspace, marker: string): Promise<void> {
  await Promise.all([
    writeFile(join(workspace.slidesPath, "01-cover.png"), marker),
    writeFile(workspace.pdfPath, marker),
    writeFile(workspace.reportPath, marker),
    writeFile(workspace.reportChecksumPath, marker),
  ]);
}

async function publishedMarker(output: string): Promise<string[]> {
  return Promise.all([
    readFile(join(output, "slides", "01-cover.png"), "utf8"),
    readFile(join(output, "dossier.pdf"), "utf8"),
    readFile(join(output, "render-report.json"), "utf8"),
    readFile(join(output, "render-report.sha256"), "utf8"),
  ]);
}

const temporary = await mkdtemp(join(os.tmpdir(), "dossier-render-integrity-"));
try {
  const output = join(temporary, "rendered");
  await mkdir(join(output, "slides"), { recursive: true });
  await Promise.all([
    writeFile(join(output, "slides", "01-cover.png"), "old"),
    writeFile(join(output, "dossier.pdf"), "old"),
    writeFile(join(output, "render-report.json"), "old"),
    writeFile(join(output, "render-report.sha256"), "old"),
  ]);
  const failedWorkspace = await prepareRenderWorkspace(output);
  await writeFile(join(failedWorkspace.slidesPath, "partial.png"), "partial");
  await cleanupRenderWorkspace(failedWorkspace);
  assert.deepEqual(await publishedMarker(output), ["old", "old", "old", "old"]);

  const completeWorkspace = await prepareRenderWorkspace(output);
  await populate(completeWorkspace, "complete");
  await publishRenderWorkspace(completeWorkspace);
  await cleanupRenderWorkspace(completeWorkspace);
  assert.deepEqual(await publishedMarker(output), ["complete", "complete", "complete", "complete"]);

  const brokenWorkspace = await prepareRenderWorkspace(output);
  await populate(brokenWorkspace, "broken");
  await rm(brokenWorkspace.reportChecksumPath);
  await assert.rejects(publishRenderWorkspace(brokenWorkspace), /Artefact de rendu absent/);
  await cleanupRenderWorkspace(brokenWorkspace);
  assert.deepEqual(await publishedMarker(output), ["complete", "complete", "complete", "complete"]);

  const first = await prepareRenderWorkspace(output);
  const second = await prepareRenderWorkspace(output);
  assert.equal(await exists(first.stagingPath), true);
  assert.equal(await exists(second.stagingPath), true);
  await Promise.all([populate(first, "first"), populate(second, "second")]);
  await Promise.all([publishRenderWorkspace(first), publishRenderWorkspace(second)]);
  await Promise.all([cleanupRenderWorkspace(first), cleanupRenderWorkspace(second)]);
  const concurrentMarkers = await publishedMarker(output);
  assert.ok(concurrentMarkers.every((marker) => marker === concurrentMarkers[0]));
  assert.ok(concurrentMarkers[0] === "first" || concurrentMarkers[0] === "second");
} finally {
  await rm(temporary, { force: true, recursive: true });
}

const localOrigin = "http://127.0.0.1:4173";
assert.equal(isAllowedRenderRequest(`${localOrigin}/src/main.tsx`, localOrigin), true);
assert.equal(isAllowedRenderRequest("data:image/png;base64,AA==", localOrigin), true);
assert.equal(isAllowedRenderRequest("blob:http://127.0.0.1:4173/id", localOrigin), true);
assert.equal(isAllowedRenderRequest("https://tracker.example/pixel", localOrigin), false);
assert.equal(isAllowedRenderRequest("http://127.0.0.1:4174/other", localOrigin), false);
assert.equal(isAllowedRenderSocket("ws://127.0.0.1:4173/hmr", localOrigin), true);
assert.equal(isAllowedRenderSocket("wss://tracker.example/socket", localOrigin), false);

console.log("Tests intégrité rendu: rollback, concurrence et connexions locales validés.");
