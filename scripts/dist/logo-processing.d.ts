export type Matte = "black" | "white";
export interface PrepareLogoOptions {
    readonly inputPath: string;
    readonly outputDirectory: string;
    readonly marginFraction?: number;
    readonly outputLongestSide?: number;
    readonly matte?: Matte;
    readonly darkColor?: string;
    readonly lightColor?: string;
}
export interface LogoReport {
    readonly schemaVersion: 1;
    readonly status: "ok";
    readonly source: {
        readonly file: string;
        readonly format: "png" | "svg";
        readonly bytes: number;
        readonly sha256: string;
        readonly width: number;
        readonly height: number;
        readonly aspectRatio: number;
        readonly hasAlphaChannel: boolean;
        readonly hasTransparentPixels: boolean;
        readonly transparentPixelShare: number;
    };
    readonly processing: {
        readonly matteRemoval: Matte | null;
        readonly marginFraction: number;
        readonly targetLongestSide: number;
        readonly trimmedDimensions: readonly [number, number];
        readonly contentDimensions: readonly [number, number];
        readonly outputDimensions: readonly [number, number];
        readonly scaleFactor: number;
        readonly rasterUpscaled: boolean;
    };
    readonly sourceAssessment: {
        readonly rating: "vector-source" | "native-resolution-raster" | "limited-raster";
        readonly notes: readonly string[];
        readonly warnings: readonly string[];
    };
    readonly outputs: {
        readonly original: LogoOutput;
        readonly dark: LogoOutput;
        readonly light: LogoOutput;
    };
}
interface LogoOutput {
    readonly file: string;
    readonly sha256: string;
}
export declare function prepareLogo(options: PrepareLogoOptions): Promise<LogoReport>;
export {};
