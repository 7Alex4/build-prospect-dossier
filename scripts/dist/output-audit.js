import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createContactSheet } from "./contact-sheet.js";
import { IMAGE_CONCURRENCY, isSupportedImage, mapWithConcurrency, MAX_IMAGE_BYTES, MAX_IMAGE_FILES, MAX_IMAGE_PIXELS, naturalCompare, sha256File, UserInputError, writeJson, } from "./core.js";
import { inspectPdfOutput } from "./pdf-output-audit.js";
import { inspectRenderReport } from "./render-report-audit.js";
const EXPECTED_WIDTH = 2000;
const EXPECTED_HEIGHT = 1414;
const PAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png", ".webp"]);
function pageNumber(fileName) {
    const stem = path.basename(fileName, path.extname(fileName));
    const leading = /^(\d+)(?:$|[-_ .])/.exec(stem)?.[1];
    const trailing = /(?:^|[-_ .])(\d+)$/.exec(stem)?.[1];
    const value = leading ?? trailing;
    if (value === undefined) {
        return null;
    }
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
}
function numberingIssues(pages) {
    const issues = [];
    const unnumbered = pages.filter((page) => page.number === null).map((page) => page.file);
    if (unnumbered.length > 0) {
        issues.push(`Unnumbered page image(s): ${unnumbered.join(", ")}.`);
    }
    const numbers = pages.flatMap((page) => page.number === null ? [] : [page.number]);
    const duplicates = [...new Set(numbers.filter((value, index) => numbers.indexOf(value) !== index))];
    if (duplicates.length > 0) {
        issues.push(`Duplicate page number(s): ${duplicates.join(", ")}.`);
    }
    const unique = [...new Set(numbers)].sort((left, right) => left - right);
    for (let index = 0; index < unique.length; index += 1) {
        const expected = index + 1;
        if (unique[index] !== expected) {
            issues.push(`Page numbering must be contiguous from 1; expected ${expected}, found ${unique[index] ?? "nothing"}.`);
            break;
        }
    }
    return issues;
}
async function inspectPage(filePath) {
    const fileName = path.basename(filePath);
    const fileStat = await stat(filePath);
    if (fileStat.size > MAX_IMAGE_BYTES) {
        throw new UserInputError(`Page exceeds the ${MAX_IMAGE_BYTES}-byte safety limit: ${fileName}`);
    }
    const sha256 = await sha256File(filePath);
    const issues = [];
    let format = null;
    let colorSpace = null;
    let channels = null;
    let hasAlpha = null;
    let width = null;
    let height = null;
    if (fileStat.size === 0) {
        issues.push("File is empty.");
    }
    else {
        try {
            const metadata = await sharp(filePath, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
            format = metadata.format ?? null;
            colorSpace = metadata.space ?? null;
            channels = metadata.channels ?? null;
            hasAlpha = metadata.hasAlpha ?? null;
            width = metadata.width ?? null;
            height = metadata.height ?? null;
            if (format !== "png") {
                issues.push(`Final page format must be PNG, found ${format ?? "unknown"}.`);
            }
            if (colorSpace !== "srgb") {
                issues.push(`Final page colour space must be sRGB, found ${colorSpace ?? "unknown"}.`);
            }
            if (hasAlpha === true) {
                issues.push("Final page must be opaque and must not contain an alpha channel.");
            }
            if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
                issues.push(`Expected ${EXPECTED_WIDTH}×${EXPECTED_HEIGHT}, found ${width ?? "?"}×${height ?? "?"}.`);
            }
        }
        catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            issues.push(`Image cannot be decoded: ${detail}`);
        }
    }
    return {
        file: fileName,
        number: pageNumber(fileName),
        bytes: fileStat.size,
        sha256,
        format,
        colorSpace,
        channels,
        hasAlpha,
        width,
        height,
        valid: issues.length === 0,
        issues,
    };
}
export async function auditOutput(options) {
    const pagesDirectory = path.resolve(options.pagesDirectory);
    const directoryStat = await stat(pagesDirectory).catch(() => undefined);
    if (directoryStat === undefined || !directoryStat.isDirectory()) {
        throw new UserInputError(`Pages source is not a readable directory: ${options.pagesDirectory}`);
    }
    const entries = await readdir(pagesDirectory, { withFileTypes: true });
    const pageFiles = entries
        .filter((entry) => entry.isFile()
        && entry.name !== "contact-sheet.png"
        && isSupportedImage(entry.name)
        && PAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
        .map((entry) => path.join(pagesDirectory, entry.name));
    if (pageFiles.length > MAX_IMAGE_FILES) {
        throw new UserInputError(`Page batch exceeds the ${MAX_IMAGE_FILES}-file safety limit.`);
    }
    const pages = await mapWithConcurrency(pageFiles, IMAGE_CONCURRENCY, inspectPage);
    pages.sort((left, right) => {
        const leftNumber = left.number ?? Number.MAX_SAFE_INTEGER;
        const rightNumber = right.number ?? Number.MAX_SAFE_INTEGER;
        return leftNumber - rightNumber || naturalCompare(left.file, right.file);
    });
    const issues = numberingIssues(pages);
    if (pages.length === 0) {
        issues.push("No page images were found.");
    }
    for (const page of pages) {
        for (const issue of page.issues) {
            issues.push(`${page.file}: ${issue}`);
        }
    }
    let pdf = null;
    let renderReport = null;
    if (options.pdfPath !== undefined) {
        const pdfInspection = await inspectPdfOutput(options.pdfPath, pages.map((page) => ({
            file: page.file,
            filePath: path.join(pagesDirectory, page.file),
            sha256: page.sha256,
        })));
        pdf = pdfInspection.report;
        issues.push(...pdfInspection.issues);
        const reportPath = options.renderReportPath
            ?? path.join(path.dirname(path.resolve(options.pdfPath)), "render-report.json");
        try {
            const reportInspection = await inspectRenderReport(reportPath, pages.map((page) => ({ file: page.file, sha256: page.sha256 })), options.pdfPath, options.sourcePath);
            renderReport = reportInspection.report;
            issues.push(...reportInspection.issues);
        }
        catch (error) {
            issues.push(error instanceof Error ? error.message : String(error));
        }
    }
    else if (options.renderReportPath !== undefined) {
        const reportInspection = await inspectRenderReport(options.renderReportPath, pages.map((page) => ({ file: page.file, sha256: page.sha256 })), undefined, options.sourcePath);
        renderReport = reportInspection.report;
        issues.push(...reportInspection.issues);
    }
    const report = {
        schemaVersion: 1,
        status: issues.length === 0 ? "pass" : "fail",
        expected: {
            width: EXPECTED_WIDTH,
            height: EXPECTED_HEIGHT,
            firstPage: 1,
            format: "png",
            colorSpace: "srgb",
            hasAlpha: false,
        },
        pageCount: pages.length,
        pages,
        pdf,
        renderReport,
        issues,
    };
    const outputDirectory = path.resolve(options.outputDirectory);
    await mkdir(outputDirectory, { recursive: true });
    await writeJson(path.join(outputDirectory, "audit.json"), report);
    const contactItems = pages.flatMap((page) => page.width === null || page.height === null || page.bytes === 0
        ? []
        : [{
                filePath: path.join(pagesDirectory, page.file),
                label: page.file,
                subtitle: `${page.width}×${page.height} · ${page.valid ? "PASS" : "FAIL"}`,
            }]);
    await createContactSheet(contactItems, path.join(outputDirectory, "contact-sheet.png"), "Output audit");
    return report;
}
//# sourceMappingURL=output-audit.js.map