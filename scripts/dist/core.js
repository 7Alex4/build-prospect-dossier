import { createHash } from "node:crypto";
import { createReadStream, realpathSync } from "node:fs";
import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const IMAGE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png", ".svg", ".webp"]);
export const MAX_IMAGE_FILES = 250;
export const MAX_IMAGE_BYTES = 200 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 100_000_000;
export const IMAGE_CONCURRENCY = 4;
const naturalCollator = new Intl.Collator("en", {
    numeric: true,
    sensitivity: "base",
});
export class UserInputError extends Error {
    constructor(message) {
        super(message);
        this.name = "UserInputError";
    }
}
export function naturalCompare(left, right) {
    return naturalCollator.compare(left, right);
}
export function isSupportedImage(filePath) {
    return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}
export async function sha256File(filePath, maximumBytes = MAX_IMAGE_BYTES) {
    const hash = createHash("sha256");
    let bytesRead = 0;
    for await (const chunk of createReadStream(filePath)) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytesRead += bytes.length;
        if (bytesRead > maximumBytes) {
            throw new UserInputError(`File exceeds the ${maximumBytes}-byte safety limit: ${filePath}`);
        }
        hash.update(bytes);
    }
    return hash.digest("hex");
}
export async function mapWithConcurrency(items, concurrency, worker) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
        throw new UserInputError("Concurrency must be a positive integer.");
    }
    const results = new Array(items.length);
    let nextIndex = 0;
    async function run() {
        while (nextIndex < items.length) {
            const index = nextIndex;
            nextIndex += 1;
            const item = items[index];
            if (item !== undefined)
                results[index] = await worker(item, index);
        }
    }
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => run());
    await Promise.all(workers);
    return results;
}
export function toPosixPath(filePath) {
    return filePath.split(path.sep).join("/");
}
export function round(value, places = 6) {
    const multiplier = 10 ** places;
    return Math.round(value * multiplier) / multiplier;
}
export async function writeJson(filePath, value) {
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
export async function listImages(rootDirectory, recursive, excludedDirectory) {
    const root = path.resolve(rootDirectory);
    const excluded = excludedDirectory === undefined ? undefined : path.resolve(excludedDirectory);
    const files = [];
    async function visit(directory) {
        const entries = await readdir(directory, { withFileTypes: true });
        entries.sort((left, right) => naturalCompare(left.name, right.name));
        for (const entry of entries) {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                if (recursive && path.resolve(entryPath) !== excluded) {
                    await visit(entryPath);
                }
            }
            else if (entry.isFile() && isSupportedImage(entryPath)) {
                files.push(entryPath);
                if (files.length > MAX_IMAGE_FILES) {
                    throw new UserInputError(`Image batch exceeds the ${MAX_IMAGE_FILES}-file safety limit.`);
                }
            }
        }
    }
    const rootStat = await stat(root).catch(() => undefined);
    if (rootStat === undefined || !rootStat.isDirectory()) {
        throw new UserInputError(`Image source is not a readable directory: ${rootDirectory}`);
    }
    if (excluded !== root) {
        await visit(root);
    }
    return files.sort((left, right) => naturalCompare(toPosixPath(path.relative(root, left)), toPosixPath(path.relative(root, right))));
}
export function isMainModule(importMetaUrl) {
    const scriptPath = process.argv[1];
    if (scriptPath === undefined) {
        return false;
    }
    const canonicalPath = (value) => {
        try {
            return realpathSync.native(value);
        }
        catch {
            return path.resolve(value);
        }
    };
    return canonicalPath(fileURLToPath(importMetaUrl)) === canonicalPath(scriptPath);
}
export function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
//# sourceMappingURL=core.js.map