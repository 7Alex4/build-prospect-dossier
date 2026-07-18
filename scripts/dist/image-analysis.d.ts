export interface PaletteColor {
    readonly hex: string;
    readonly coverage: number;
}
export interface ImageInventoryEntry {
    readonly path: string;
    readonly format: string;
    readonly width: number;
    readonly height: number;
    readonly aspectRatio: number;
    readonly orientation: number | null;
    readonly bytes: number;
    readonly sha256: string;
    readonly dominantPalette: readonly PaletteColor[];
}
export declare function analyzeImage(filePath: string, rootDirectory: string, paletteLimit: number): Promise<ImageInventoryEntry>;
