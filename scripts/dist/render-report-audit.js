import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { UserInputError } from "./core.js";
const MAX_REPORT_BYTES = 2 * 1024 * 1024;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function stringArray(value) {
    return Array.isArray(value) && value.every((entry) => typeof entry === "string") ? value : null;
}
function safeName(value) {
    const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    return normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64);
}
function expectedFile(slideId, index) {
    return `${String(index + 1).padStart(2, "0")}-${safeName(slideId)}.png`;
}
export async function inspectRenderReport(reportPath, orderedPageFiles) {
    const resolved = path.resolve(reportPath);
    const fileStat = await stat(resolved).catch(() => {
        throw new UserInputError(`Render report is not readable: ${reportPath}`);
    });
    if (fileStat.size > MAX_REPORT_BYTES) {
        throw new UserInputError(`Render report exceeds the ${MAX_REPORT_BYTES}-byte safety limit.`);
    }
    let parsed;
    try {
        parsed = JSON.parse(await readFile(resolved, "utf8"));
    }
    catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new UserInputError(`Render report is invalid JSON: ${detail}`);
    }
    const value = isRecord(parsed) ? parsed : {};
    const schemaVersion = typeof value.schemaVersion === "string" ? value.schemaVersion : null;
    const stage = typeof value.stage === "string" ? value.stage : null;
    const totalSlides = Number.isInteger(value.totalSlides) ? value.totalSlides : null;
    const renderedCount = Number.isInteger(value.renderedCount) ? value.renderedCount : null;
    const selectionApplied = typeof value.selectionApplied === "boolean" ? value.selectionApplied : null;
    const selection = stringArray(value.selection);
    const renderedSlideIds = stringArray(value.renderedSlideIds);
    const issues = [];
    if (schemaVersion !== "1.0")
        issues.push("Render report schemaVersion must be 1.0.");
    if (stage !== "final")
        issues.push("Render report stage must be final for delivery.");
    if (selectionApplied !== false || selection === null || selection.length !== 0) {
        issues.push("Render report must describe a full render with no slide selection.");
    }
    if (totalSlides === null || renderedCount === null || renderedSlideIds === null) {
        issues.push("Render report is missing totalSlides, renderedCount or renderedSlideIds.");
    }
    else {
        if (totalSlides !== orderedPageFiles.length || renderedCount !== totalSlides || renderedSlideIds.length !== totalSlides) {
            issues.push("Render report slide counts must match the complete PNG sequence.");
        }
        const duplicateIds = new Set(renderedSlideIds).size !== renderedSlideIds.length;
        if (duplicateIds)
            issues.push("Render report contains duplicate slide IDs.");
        const expectedFiles = renderedSlideIds.map(expectedFile);
        if (expectedFiles.length !== orderedPageFiles.length
            || expectedFiles.some((file, index) => file !== orderedPageFiles[index])) {
            issues.push("Render report slide IDs and order do not match the PNG filenames.");
        }
    }
    return {
        report: {
            file: path.basename(resolved),
            schemaVersion,
            stage,
            totalSlides,
            renderedCount,
            selectionApplied,
            selection,
            renderedSlideIds,
            fullFinalRender: issues.length === 0,
        },
        issues,
    };
}
//# sourceMappingURL=render-report-audit.js.map