export interface ExpectedRenderPage {
    readonly file: string;
    readonly sha256: string;
}
export interface DeclaredFileIntegrity {
    readonly file: string;
    readonly sha256: string;
}
export interface DeclaredSourceIntegrity extends DeclaredFileIntegrity {
    readonly dossierSha256: string;
}
export interface RenderReportStructure {
    readonly schemaVersion: string | null;
    readonly stage: string | null;
    readonly totalSlides: number | null;
    readonly renderedCount: number | null;
    readonly selectionApplied: boolean | null;
    readonly selection: readonly string[] | null;
    readonly renderedSlideIds: readonly string[] | null;
    readonly pdf: DeclaredFileIntegrity | null;
    readonly source: DeclaredSourceIntegrity | null;
}
export interface RenderReportStructureInspection {
    readonly structure: RenderReportStructure;
    readonly issues: readonly string[];
}
export declare function inspectRenderReportStructure(parsed: unknown, orderedPages: readonly ExpectedRenderPage[]): RenderReportStructureInspection;
