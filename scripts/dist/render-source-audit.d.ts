import type { DeclaredSourceIntegrity } from "./render-report-structure.js";
export interface RenderSourceAudit {
    readonly sourceHashValid: boolean;
    readonly dossierHashValid: boolean | null;
    readonly issues: readonly string[];
}
export declare function inspectRenderSource(declared: DeclaredSourceIntegrity | null, sourcePath: string): Promise<RenderSourceAudit>;
