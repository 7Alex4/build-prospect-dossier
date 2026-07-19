export type Matte = "black" | "white";
export type HexColor = `#${string}`;
export type MatteRemoval = Matte | HexColor;
export type RgbColor = readonly [number, number, number];
export interface ParsedHexColor {
    readonly hex: HexColor;
    readonly rgb: RgbColor;
}
export interface MatteDefinition extends ParsedHexColor {
    readonly reportValue: MatteRemoval;
}
export interface MatteRemovalStats {
    readonly referenceDistance: number;
    readonly nonMattePixelCount: number;
}
export declare function parseHexColor(value: string, label: string): ParsedHexColor;
export declare function resolveMatteDefinition(matte: string | undefined, matteColor: string | undefined): MatteDefinition | undefined;
export declare function applyNormalizedMatteRemoval(pixels: Uint8Array, matte: RgbColor): MatteRemovalStats;
