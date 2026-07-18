import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { validateDossier, type ValidationIssue } from "../src/schema/validation";
import { collectAssets, loadDossier, resolveAsset } from "./lib/input";

function line(entry: ValidationIssue): string {
  const marker = entry.level === "error" ? "ERREUR" : "AVERTISSEMENT";
  return `${marker} [${entry.code}] ${entry.path}: ${entry.message}`;
}

async function validateAssetFiles(inputPath: string, value: unknown): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  for (const asset of collectAssets(value)) {
    if (asset.src.startsWith("data:")) continue;
    if (/^https?:\/\//.test(asset.src)) {
      continue;
    }
    try {
      await access(resolveAsset(asset.src, inputPath));
    } catch {
      issues.push({
        level: "error",
        code: "missing-asset",
        path: asset.path,
        message: `Fichier introuvable: ${asset.src}`,
      });
    }
  }
  return issues;
}

async function main(): Promise<void> {
  const inputPath = resolve(process.argv[2] ?? "src/content/example.ts");
  const dossier = await loadDossier(inputPath);
  const issues = [
    ...validateDossier(dossier),
    ...await validateAssetFiles(inputPath, dossier),
  ];
  issues.forEach((entry) => console.log(line(entry)));
  const errors = issues.filter((entry) => entry.level === "error");
  const warnings = issues.length - errors.length;
  console.log(`Validation: ${dossier.slides.length} slides, ${errors.length} erreur(s), ${warnings} avertissement(s).`);
  if (errors.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
