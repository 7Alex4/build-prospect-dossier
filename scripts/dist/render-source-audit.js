import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { tsImport } from "tsx/esm/api";
import { sha256File } from "./core.js";
const MAX_SOURCE_BYTES = 32 * 1024 * 1024;
const LOADABLE_EXTENSIONS = new Set([".cjs", ".js", ".json", ".mjs", ".ts", ".tsx"]);
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function pickDossierExport(moduleValue) {
    let current = moduleValue;
    for (let depth = 0; depth < 6; depth += 1) {
        if (!isRecord(current) || "slides" in current)
            return current;
        const direct = Object.values(current).find((value) => isRecord(value) && "slides" in value);
        if (direct !== undefined)
            return direct;
        const record = current;
        const next = ["default", "dossier", "exampleDossier", "module.exports"]
            .flatMap((key) => key in record ? [record[key]] : [])[0];
        if (next === undefined || next === current)
            return current;
        current = next;
    }
    return current;
}
function dossierHash(value) {
    const serialized = JSON.stringify(value);
    return serialized === undefined
        ? null
        : createHash("sha256").update(serialized).digest("hex");
}
async function loadDossierValue(sourcePath) {
    const extension = path.extname(sourcePath).toLowerCase();
    if (extension === ".json")
        return JSON.parse(await readFile(sourcePath, "utf8"));
    const imported = extension === ".ts" || extension === ".tsx"
        ? await tsImport(`${pathToFileURL(sourcePath).href}?audit=${Date.now()}`, { parentURL: import.meta.url })
        : await import(`${pathToFileURL(sourcePath).href}?audit=${Date.now()}`);
    return pickDossierExport(imported);
}
export async function inspectRenderSource(declared, sourcePath) {
    const issues = [];
    if (declared === null) {
        return {
            sourceHashValid: false,
            dossierHashValid: null,
            issues: ["Render report source integrity is unavailable for source verification."],
        };
    }
    const resolved = path.resolve(sourcePath);
    let sourceHashValid = false;
    try {
        const actualHash = await sha256File(resolved, MAX_SOURCE_BYTES);
        sourceHashValid = actualHash === declared.sha256 && path.basename(resolved) === declared.file;
        if (!sourceHashValid)
            issues.push("Render report source hash or filename does not match the audited source.");
    }
    catch (error) {
        issues.push(error instanceof Error ? error.message : String(error));
    }
    let dossierHashValid = null;
    if (LOADABLE_EXTENSIONS.has(path.extname(resolved).toLowerCase())) {
        try {
            const actualDossierHash = dossierHash(await loadDossierValue(resolved));
            if (actualDossierHash !== null) {
                dossierHashValid = actualDossierHash === declared.dossierSha256;
                if (!dossierHashValid) {
                    issues.push("Render report dossier hash does not match the dossier loaded from source.");
                }
            }
        }
        catch (error) {
            dossierHashValid = null;
            const detail = error instanceof Error ? error.message : String(error);
            issues.push(`Render report dossier source could not be loaded for hash verification: ${detail}`);
        }
    }
    else {
        issues.push(`Render report dossier source extension is not independently loadable: ${path.extname(resolved) || "none"}.`);
    }
    return { sourceHashValid, dossierHashValid, issues };
}
//# sourceMappingURL=render-source-audit.js.map