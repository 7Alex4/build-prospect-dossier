import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { prepareLogo } from "../src/logo-processing.js";

test("prepare logo preserves the source and emits transparent monochrome variants", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-logo-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const input = path.join(temporary, "logo.png");
  const output = path.join(temporary, "prepared");
  await sharp({ create: { width: 200, height: 100, channels: 4, background: "#00000000" } })
    .composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><rect width="100" height="40" rx="8" fill="#e6492d"/></svg>'), left: 50, top: 30 }])
    .png()
    .toFile(input);
  const sourceBytes = await readFile(input);

  const report = await prepareLogo({ inputPath: input, outputDirectory: output, outputLongestSide: 400, marginFraction: 0.1 });

  assert.equal(report.status, "ok");
  assert.equal(report.source.hasTransparentPixels, true);
  assert.equal(report.processing.matteRemoval, null);
  assert.deepEqual(await readFile(path.join(output, "logo.original.png")), sourceBytes);
  const darkMetadata = await sharp(path.join(output, "logo.dark.png")).metadata();
  assert.equal(darkMetadata.hasAlpha, true);
  assert.ok((darkMetadata.width ?? 0) <= 400);
  assert.match(await readFile(path.join(output, "report.json"), "utf8"), /scaling does not recover detail/);
});

test("opaque logos fail unless matte removal is explicit", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-logo-matte-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const input = path.join(temporary, "opaque.png");
  await sharp({ create: { width: 160, height: 80, channels: 3, background: "white" } })
    .composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30"><rect width="80" height="30" fill="black"/></svg>'), left: 40, top: 25 }])
    .png()
    .toFile(input);

  await assert.rejects(
    prepareLogo({ inputPath: input, outputDirectory: path.join(temporary, "rejected") }),
    /no transparent pixels/i,
  );
  const report = await prepareLogo({
    inputPath: input,
    outputDirectory: path.join(temporary, "accepted"),
    matte: "white",
    outputLongestSide: 300,
  });
  assert.equal(report.processing.matteRemoval, "white");
  assert.match(report.sourceAssessment.notes.join(" "), /inferred/);
});
