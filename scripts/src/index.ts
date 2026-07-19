export {
  auditOutput,
  type AuditedPage,
  type AuditOutputOptions,
  type OutputAuditReport,
} from "./output-audit.js";
export {
  type ExpectedPdfSource,
  type PdfAuditReport,
  type PdfPageAudit,
} from "./pdf-output-audit.js";
export { type RenderReportAudit } from "./render-report-audit.js";
export { validateRenderFonts } from "./render-report-font-validation.js";
export { initProject, type InitProjectOptions, type InitProjectResult } from "./project-scaffold.js";
export { type GenerativeAssetAuthorization, type ScaffoldProfile } from "./project-workflow-files.js";
export { prepareLogo, type LogoReport, type Matte, type PrepareLogoOptions } from "./logo-processing.js";
export { runSourceAudit, type SourceAuditManifest, type SourceAuditOptions } from "./source-audit.js";
