#!/usr/bin/env node
import { type ImageInventoryEntry } from "./image-analysis.js";
export interface SourceAuditOptions {
    readonly sourceDirectory: string;
    readonly outputDirectory: string;
    readonly paletteSize?: number;
    readonly recursive?: boolean;
}
export interface SourceAuditManifest {
    readonly schemaVersion: 1;
    readonly source: ".";
    readonly recursive: boolean;
    readonly imageCount: number;
    readonly images: readonly ImageInventoryEntry[];
}
export declare const SOURCE_AUDIT_HELP = "source-audit <image-directory> [options]\n\nInventories PNG, JPEG, WebP and SVG files in natural order. Writes manifest.json,\nmanifest.md and contact-sheet.png. Palette colours are measured from decoded pixels.\n\nOptions:\n  --out <directory>   Output directory (default: <source>/source-audit)\n  --palette <1-10>    Dominant colours per image (default: 5)\n  --flat              Do not recurse into subdirectories\n  --help              Show this help\n";
export declare function runSourceAudit(options: SourceAuditOptions): Promise<SourceAuditManifest>;
export declare function sourceAuditCli(arguments_: readonly string[]): Promise<number>;
