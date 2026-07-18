export interface GenerativeAssetAuthorization {
    readonly authorizedBy: string;
    readonly reference: string;
}
export type ScaffoldProfile = "black-flower" | "neutral";
export declare function createWorkflowFiles(profile?: ScaffoldProfile, authorization?: GenerativeAssetAuthorization): Readonly<Record<string, string>>;
