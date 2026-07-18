export interface ExpectedPdfSource {
    readonly file: string;
    readonly filePath: string;
    readonly sha256: string;
}
export interface PdfPageAudit {
    readonly page: number;
    readonly width: number;
    readonly height: number;
    readonly validA4Landscape: boolean;
    readonly sourceFile: string | null;
    readonly sourceSha256: string | null;
    readonly matchesExpectedSource: boolean;
    readonly contentMeanAbsoluteError: number | null;
    readonly contentChangedPixelRatio: number | null;
    readonly matchesExpectedContent: boolean;
}
export interface PdfAuditReport {
    readonly file: string;
    readonly bytes: number;
    readonly pageCount: number | null;
    readonly matchesImageCount: boolean;
    readonly mediaBoxesValid: boolean;
    readonly sourceLinksValid: boolean;
    readonly contentMatches: boolean;
    readonly orderMatches: boolean;
    readonly expectedMediaBox: {
        readonly width: 841.89;
        readonly height: 595.28;
        readonly tolerance: 0.2;
    };
    readonly pages: readonly PdfPageAudit[];
}
export declare function inspectPdfOutput(pdfPath: string, expectedSources: readonly ExpectedPdfSource[]): Promise<{
    report: PdfAuditReport;
    issues: readonly string[];
}>;
