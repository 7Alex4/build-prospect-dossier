import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

interface CommandResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

const commandPath = fileURLToPath(new URL("../src/prepare-logo.ts", import.meta.url));

function runCli(arguments_: readonly string[]): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", commandPath, ...arguments_]);
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (exitCode) => {
      resolve({ exitCode: exitCode ?? -1, stdout, stderr });
    });
  });
}

test("prepare-logo help documents arbitrary colour matte handling", async () => {
  const result = await runCli(["--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /--matte-color <#RRGGBB>/);
  assert.match(result.stdout, /Edge inspection .* is required/);
  assert.equal(result.stderr, "");
});

test("prepare-logo CLI accepts a colour matte and records it", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-logo-cli-colour-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const input = path.join(temporary, "logo.png");
  const output = path.join(temporary, "prepared");
  await sharp({ create: { width: 120, height: 60, channels: 3, background: "#ec1018" } })
    .composite([{
      input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="24"><rect width="64" height="24" fill="white"/></svg>'),
      left: 28,
      top: 18,
    }])
    .png()
    .toFile(input);

  const result = await runCli([input, "--out", output, "--size", "128", "--matte-color", "#ec1018"]);

  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /Prepared logo\.dark\.png and logo\.light\.png/);
  assert.equal(result.stderr, "");
  const reportText = await readFile(path.join(output, "report.json"), "utf8");
  assert.match(reportText, /"matteRemoval": "#EC1018"/);
  assert.match(reportText, /"matteMethod": "normalized-rgb-distance"/);
});

test("prepare-logo CLI rejects two matte declarations", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "prospect-logo-cli-conflict-"));
  context.after(async () => rm(temporary, { recursive: true, force: true }));
  const input = path.join(temporary, "logo.png");
  await sharp({ create: { width: 80, height: 40, channels: 3, background: "white" } }).png().toFile(input);

  const result = await runCli([input, "--matte", "white", "--matte-color", "#FFFFFF"]);

  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /Use either --matte or --matte-color, not both/);
});
