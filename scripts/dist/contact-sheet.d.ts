export interface ContactSheetItem {
    readonly filePath: string;
    readonly label: string;
    readonly subtitle?: string;
}
export declare function createContactSheet(items: readonly ContactSheetItem[], outputPath: string, title: string): Promise<void>;
