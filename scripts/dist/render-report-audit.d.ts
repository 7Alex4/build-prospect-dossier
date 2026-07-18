export interface RenderReportAudit {
    readonly file: string;
    readonly schemaVersion: string | null;
    readonly stage: string | null;
    readonly totalSlides: number | null;
    readonly renderedCount: number | null;
    readonly selectionApplied: boolean | null;
    readonly selection: readonly string[] | null;
    readonly renderedSlideIds: readonly string[] | null;
    readonly fullFinalRender: boolean;
}
export declare function inspectRenderReport(reportPath: string, orderedPageFiles: readonly string[]): Promise<{
    report: RenderReportAudit;
    issues: readonly string[];
}>;
