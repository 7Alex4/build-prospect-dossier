export declare const MAX_IMAGE_FILES = 250;
export declare const MAX_IMAGE_BYTES: number;
export declare const MAX_IMAGE_PIXELS = 100000000;
export declare const IMAGE_CONCURRENCY = 4;
export declare class UserInputError extends Error {
    constructor(message: string);
}
export declare function naturalCompare(left: string, right: string): number;
export declare function isSupportedImage(filePath: string): boolean;
export declare function sha256File(filePath: string, maximumBytes?: number): Promise<string>;
export declare function mapWithConcurrency<T, Result>(items: readonly T[], concurrency: number, worker: (item: T, index: number) => Promise<Result>): Promise<Result[]>;
export declare function toPosixPath(filePath: string): string;
export declare function round(value: number, places?: number): number;
export declare function writeJson(filePath: string, value: unknown): Promise<void>;
export declare function listImages(rootDirectory: string, recursive: boolean, excludedDirectory?: string): Promise<string[]>;
export declare function isMainModule(importMetaUrl: string): boolean;
export declare function errorMessage(error: unknown): string;
