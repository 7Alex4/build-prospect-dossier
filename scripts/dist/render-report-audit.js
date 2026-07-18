import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { sha256File, UserInputError } from "./core.js";
import { inspectRenderReportStructure, } from "./render-report-structure.js";
import { inspectRenderSource } from "./render-source-audit.js";
const MAX_REPORT_BYTES = 2 * 1024 * 1024;
const MAX_PDF_BYTES = 500 * 1024 * 1024;
const MAX_CHECKSUM_BYTES = 1024;
function checksumPath(reportPath) {
    const extension = path.extname(reportPath);
    return path.join(path.dirname(reportPath), `${path.basename(reportPath, extension)}.sha256`);
}
async function inspectChecksum(reportPath) {
    const sidecar = checksumPath(reportPath);
    const sidecarStat = await stat(sidecar).catch(() => undefined);
    if (sidecarStat === undefined || !sidecarStat.isFile())
        return null;
    if (sidecarStat.size > MAX_CHECKSUM_BYTES)
        return null;
    const match = /^([0-9a-f]{64})  ([^\r\n]+)\r?\n?$/.exec(await readFile(sidecar, "utf8"));
    if (match?.[2] !== path.basename(reportPath))
        return null;
    return match[1] ?? null;
}
export async function inspectRenderReport(reportPath, orderedPages, pdfPath, sourcePath) {
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
    const inspection = inspectRenderReportStructure(parsed, orderedPages);
    const issues = [...inspection.issues];
    const declaredChecksum = await inspectChecksum(resolved);
    const actualChecksum = await sha256File(resolved, MAX_REPORT_BYTES);
    const checksumValid = declaredChecksum === actualChecksum;
    if (!checksumValid)
        issues.push("Render report checksum is missing or does not match render-report.json.");
    let artifactHashesValid = inspection.structure.pdf !== null;
    if (inspection.structure.pdf !== null) {
        const declaredPdf = inspection.structure.pdf;
        const resolvedPdf = path.resolve(pdfPath ?? path.join(path.dirname(resolved), declaredPdf.file));
        if (path.basename(resolvedPdf) !== declaredPdf.file) {
            issues.push("Render report PDF filename does not match the audited PDF.");
            artifactHashesValid = false;
        }
        try {
            const actualPdfHash = await sha256File(resolvedPdf, MAX_PDF_BYTES);
            if (actualPdfHash !== declaredPdf.sha256) {
                issues.push("Render report PDF hash does not match the audited PDF.");
                artifactHashesValid = false;
            }
        }
        catch (error) {
            issues.push(error instanceof Error ? error.message : String(error));
            artifactHashesValid = false;
        }
    }
    const sourceInspection = sourcePath === undefined
        ? null
        : await inspectRenderSource(inspection.structure.source, sourcePath);
    if (sourceInspection !== null)
        issues.push(...sourceInspection.issues);
    artifactHashesValid = artifactHashesValid
        && !inspection.issues.some((issue) => issue.includes("integrity") || issue.includes("unknown asset"))
        && (sourceInspection === null || (sourceInspection.sourceHashValid
            && sourceInspection.dossierHashValid === true));
    const structure = inspection.structure;
    return {
        report: {
            file: path.basename(resolved),
            schemaVersion: structure.schemaVersion,
            stage: structure.stage,
            totalSlides: structure.totalSlides,
            renderedCount: structure.renderedCount,
            selectionApplied: structure.selectionApplied,
            selection: structure.selection,
            renderedSlideIds: structure.renderedSlideIds,
            checksumValid,
            artifactHashesValid,
            sourceHashValid: sourceInspection?.sourceHashValid ?? null,
            dossierHashValid: sourceInspection?.dossierHashValid ?? null,
            fullFinalRender: issues.length === 0,
        },
        issues,
    };
}
//# sourceMappingURL=render-report-audit.js.map