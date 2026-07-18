import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { runSourceAudit } from "../src/source-audit.js";

test("source audit inventories supported images in natural order", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-source-audit-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const source = path.join(temporary, "source");
  const output = path.join(source, "generated-audit");
  await mkdir(path.join(source, "nested"), { recursive: true });
  await sharp({ create: { width: 80, height: 40, channels: 4, background: "#FF0000" } })
    .png()
    .toFile(path.join(source, "image-10.png"));
  await sharp({ create: { width: 60, height: 60, channels: 3, background: "#0000FF" } })
    .webp()
    .toFile(path.join(source, "image-2.webp"));
  await writeFile(
    path.join(source, "nested", "mark.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="30"><rect width="120" height="30" fill="#00ff00"/></svg>',
    "utf8",
  );

  const manifest = await runSourceAudit({ sourceDirectory: source, outputDirectory: output });

  assert.equal(manifest.imageCount, 3);
  assert.deepEqual(manifest.images.map((image) => image.path), ["image-2.webp", "image-10.png", "nested/mark.svg"]);
  assert.deepEqual([manifest.images[1]?.width, manifest.images[1]?.height], [80, 40]);
  assert.match(manifest.images[1]?.sha256 ?? "", /^[0-9a-f]{64}$/);
  assert.equal(manifest.images[1]?.dominantPalette[0]?.hex, "#FF0000");
  const markdown = await readFile(path.join(output, "manifest.md"), "utf8");
  assert.match(markdown, /Measured palette/);
  assert.ok((await stat(path.join(output, "manifest.json"))).size > 0);
  assert.ok((await stat(path.join(output, "contact-sheet.png"))).size > 0);
});

test("source audit escapes hostile filenames in Markdown output", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-source-markdown-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const source = path.join(temporary, "source");
  const output = path.join(temporary, "audit");
  await mkdir(source, { recursive: true });
  const hostileName = "<tag>&`pipe|line\r.png";
  await sharp({ create: { width: 16, height: 16, channels: 3, background: "#112233" } })
    .png()
    .toFile(path.join(source, hostileName));

  await runSourceAudit({ sourceDirectory: source, outputDirectory: output });
  const markdown = await readFile(path.join(output, "manifest.md"), "utf8");

  assert.doesNotMatch(markdown, /<tag>/);
  assert.match(markdown, /&lt;tag&gt;&amp;&#96;pipe\\\|line \.png/);
});
