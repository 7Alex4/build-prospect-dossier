#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { optionFlag, optionValue, parseCli, requireSinglePositional } from "./cli.js";
import { createContactSheet } from "./contact-sheet.js";
import { errorMessage, isMainModule, listImages, UserInputError, writeJson } from "./core.js";
import { analyzeImage } from "./image-analysis.js";
export const SOURCE_AUDIT_HELP = `source-audit <image-directory> [options]

Inventories PNG, JPEG, WebP and SVG files in natural order. Writes manifest.json,
manifest.md and contact-sheet.png. Palette colours are measured from decoded pixels.

Options:
  --out <directory>   Output directory (default: <source>/source-audit)
  --palette <1-10>    Dominant colours per image (default: 5)
  --flat              Do not recurse into subdirectories
  --help              Show this help
`;
function markdownCell(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("`", "&#96;")
        .replaceAll("|", "\\|")
        .replace(/[\r\n]+/g, " ");
}
function makeMarkdown(manifest) {
    const rows = manifest.images.map((image) => {
        const palette = image.dominantPalette
            .map((color) => `${color.hex} (${Math.round(color.coverage * 100)}%)`)
            .join(", ");
        return `| ${markdownCell(image.path)} | ${image.format} | ${image.width}×${image.height} | ${image.aspectRatio} | ${image.bytes} | \`${image.sha256}\` | ${palette} |`;
    });
    return [
        "# Source audit",
        "",
        `Images: ${manifest.imageCount}`,
        "",
        "| File | Format | Dimensions | Ratio | Bytes | SHA-256 | Measured palette |",
        "|---|---:|---:|---:|---:|---|---|",
        ...rows,
        "",
    ].join("\n");
}
export async function runSourceAudit(options) {
    const sourceDirectory = path.resolve(options.sourceDirectory);
    const outputDirectory = path.resolve(options.outputDirectory);
    if (sourceDirectory === outputDirectory) {
        throw new UserInputError("Output directory must differ from the source directory.");
    }
    const paletteSize = options.paletteSize ?? 5;
    if (!Number.isInteger(paletteSize) || paletteSize < 1 || paletteSize > 10) {
        throw new UserInputError("Palette size must be an integer from 1 to 10.");
    }
    const recursive = options.recursive ?? true;
    const files = await listImages(sourceDirectory, recursive, outputDirectory);
    const images = [];
    for (const file of files) {
        images.push(await analyzeImage(file, sourceDirectory, paletteSize));
    }
    const manifest = {
        schemaVersion: 1,
        source: ".",
        recursive,
        imageCount: images.length,
        images,
    };
    await mkdir(outputDirectory, { recursive: true });
    await writeJson(path.join(outputDirectory, "manifest.json"), manifest);
    await writeFile(path.join(outputDirectory, "manifest.md"), makeMarkdown(manifest), "utf8");
    await createContactSheet(images.map((image) => ({
        filePath: path.join(sourceDirectory, image.path),
        label: image.path,
        subtitle: `${image.width}×${image.height} · ${image.dominantPalette.map((color) => color.hex).join(" ")}`,
    })), path.join(outputDirectory, "contact-sheet.png"), "Source audit");
    return manifest;
}
export async function sourceAuditCli(arguments_) {
    try {
        const parsed = parseCli(arguments_, { help: "boolean", out: "value", palette: "value", flat: "boolean" });
        if (optionFlag(parsed.options, "help")) {
            process.stdout.write(SOURCE_AUDIT_HELP);
            return 0;
        }
        const sourceDirectory = requireSinglePositional(parsed.positionals, "source-audit <directory> [options]");
        const outputDirectory = optionValue(parsed.options, "out") ?? path.join(sourceDirectory, "source-audit");
        const paletteText = optionValue(parsed.options, "palette");
        const manifest = await runSourceAudit({
            sourceDirectory,
            outputDirectory,
            paletteSize: paletteText === undefined ? 5 : Number(paletteText),
            recursive: !optionFlag(parsed.options, "flat"),
        });
        process.stdout.write(`Audited ${manifest.imageCount} image(s) into ${path.resolve(outputDirectory)}\n`);
        return 0;
    }
    catch (error) {
        process.stderr.write(`source-audit: ${errorMessage(error)}\n`);
        return 1;
    }
}
if (isMainModule(import.meta.url)) {
    process.exitCode = await sourceAuditCli(process.argv.slice(2));
}
//# sourceMappingURL=source-audit.js.map