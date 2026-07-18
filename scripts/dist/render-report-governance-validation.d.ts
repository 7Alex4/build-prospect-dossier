export interface ReportAssetPolicy {
    readonly distributionMode: string | null;
    readonly generativeAssets: string | null;
    readonly generativeAuthorizationValid: boolean;
}
export declare function validateRenderGovernance(value: unknown, stage: string | null, issues: string[]): ReportAssetPolicy;
