import { type GenerativeAssetAuthorization, type ScaffoldProfile } from "./project-workflow-files.js";
export interface InitProjectOptions {
    readonly targetDirectory: string;
    readonly templateDirectory: string;
    readonly force?: boolean;
    readonly generativeAssetAuthorization?: GenerativeAssetAuthorization;
    readonly profile?: ScaffoldProfile;
}
export interface InitProjectResult {
    readonly targetDirectory: string;
    readonly copiedTemplateFiles: number;
    readonly createdWorkflowFiles: readonly string[];
    readonly preservedWorkflowFiles: readonly string[];
}
export declare function initProject(options: InitProjectOptions): Promise<InitProjectResult>;
