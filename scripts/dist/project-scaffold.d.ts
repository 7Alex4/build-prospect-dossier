export interface InitProjectOptions {
    readonly targetDirectory: string;
    readonly templateDirectory: string;
    readonly force?: boolean;
}
export interface InitProjectResult {
    readonly targetDirectory: string;
    readonly copiedTemplateFiles: number;
    readonly createdWorkflowFiles: readonly string[];
    readonly preservedWorkflowFiles: readonly string[];
}
export declare function initProject(options: InitProjectOptions): Promise<InitProjectResult>;
