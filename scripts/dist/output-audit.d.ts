import { type PdfAuditReport } from "./pdf-output-audit.js";
import { type RenderReportAudit } from "./render-report-audit.js";
export interface AuditOutputOptions {
    readonly pagesDirectory: string;
    readonly outputDirectory: string;
    readonly pdfPath?: string;
    readonly renderReportPath?: string;
}
export interface AuditedPage {
    readonly file: string;
    readonly number: number | null;
    readonly bytes: number;
    readonly sha256: string;
    readonly format: string | null;
    readonly colorSpace: string | null;
    readonly channels: number | null;
    readonly hasAlpha: boolean | null;
    readonly width: number | null;
    readonly height: number | null;
    readonly valid: boolean;
    readonly issues: readonly string[];
}
export interface OutputAuditReport {
    readonly schemaVersion: 1;
    readonly status: "pass" | "fail";
    readonly expected: {
        readonly width: 2000;
        readonly height: 1414;
        readonly firstPage: 1;
        readonly format: "png";
        readonly colorSpace: "srgb";
        readonly hasAlpha: false;
    };
    readonly pageCount: number;
    readonly pages: readonly AuditedPage[];
    readonly pdf: PdfAuditReport | null;
    readonly renderReport: RenderReportAudit | null;
    readonly issues: readonly string[];
}
export declare function auditOutput(options: AuditOutputOptions): Promise<OutputAuditReport>;
