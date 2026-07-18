import { type ExpectedRenderPage } from "./render-report-structure.js";
export interface RenderReportAudit {
    readonly file: string;
    readonly schemaVersion: string | null;
    readonly stage: string | null;
    readonly totalSlides: number | null;
    readonly renderedCount: number | null;
    readonly selectionApplied: boolean | null;
    readonly selection: readonly string[] | null;
    readonly renderedSlideIds: readonly string[] | null;
    readonly checksumValid: boolean;
    readonly artifactHashesValid: boolean;
    readonly sourceHashValid: boolean | null;
    readonly dossierHashValid: boolean | null;
    readonly fullFinalRender: boolean;
}
export declare function inspectRenderReport(reportPath: string, orderedPages: readonly ExpectedRenderPage[], pdfPath?: string, sourcePath?: string): Promise<{
    report: RenderReportAudit;
    issues: readonly string[];
}>;
