import { readFile, stat } from "node:fs/promises";
import { extname, isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Dossier } from "../../src/schema/types";
import { collectDossierAssetUsages } from "../../src/schema/asset-validation";
import { assertDossier } from "../../src/schema/validation";

type UnknownRecord = Record<string, unknown>;

export interface AssetReference {
  path: string;
  src: string;
}

export interface AssetHydrationLimits {
  readonly perAssetBytes: number;
  readonly totalBytes: number;
}

export const DEFAULT_ASSET_HYDRATION_LIMITS: AssetHydrationLimits = {
  perAssetBytes: 32 * 1024 * 1024,
  totalBytes: 256 * 1024 * 1024,
};

interface HydrationState {
  readonly dataUris: Set<string>;
  readonly fileCache: Map<string, Promise<string>>;
  readonly limits: AssetHydrationLimits;
  totalBytes: number;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickModuleExport(moduleValue: unknown): unknown {
  if (!isRecord(moduleValue)) return moduleValue;
  for (const key of ["default", "dossier", "exampleDossier"]) {
    if (key in moduleValue) return moduleValue[key];
  }
  const candidate = Object.values(moduleValue).find((value) => isRecord(value) && "slides" in value);
  return candidate;
}

export async function loadDossier(inputPath: string): Promise<Dossier> {
  const absolutePath = resolve(inputPath);
  let value: unknown;
  if (extname(absolutePath).toLowerCase() === ".json") {
    value = JSON.parse(await readFile(absolutePath, "utf8")) as unknown;
  } else {
    const imported: unknown = await import(`${pathToFileURL(absolutePath).href}?t=${Date.now()}`);
    value = pickModuleExport(imported);
  }
  assertDossier(value);
  return value;
}

export function collectAssets(value: unknown, path = "dossier"): AssetReference[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectAssets(item, `${path}[${index}]`));
  }
  if (!isRecord(value)) return [];
  const own = typeof value.src === "string" ? [{ path: `${path}.src`, src: value.src }] : [];
  const nested = Object.entries(value).flatMap(([key, item]) => collectAssets(item, `${path}.${key}`));
  return [...own, ...nested];
}

function mimeType(path: string): string {
  const extension = extname(path).toLowerCase();
  const types: Readonly<Record<string, string>> = {
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };
  const type = types[extension];
  if (!type) throw new Error(`Format d'image non pris en charge: ${extension || "sans extension"}`);
  return type;
}

function assetPath(src: string, baseDirectory: string): string {
  return isAbsolute(src) ? src : resolve(baseDirectory, src);
}

function reserveBytes(state: HydrationState, source: string, bytes: number): void {
  if (bytes > state.limits.perAssetBytes) {
    throw new Error(`Asset trop volumineux (${bytes} octets, maximum ${state.limits.perAssetBytes}): ${source}`);
  }
  if (state.totalBytes + bytes > state.limits.totalBytes) {
    throw new Error(`Budget total des assets dépassé (maximum ${state.limits.totalBytes} octets): ${source}`);
  }
  state.totalBytes += bytes;
}

async function hydrateSource(src: string, baseDirectory: string, state: HydrationState): Promise<string> {
  if (src.startsWith("data:")) {
    if (!state.dataUris.has(src)) {
      reserveBytes(state, "data URI", Buffer.byteLength(src, "utf8"));
      state.dataUris.add(src);
    }
    return src;
  }
  if (/^https?:\/\//.test(src)) {
    throw new Error(`Asset distant refusé pour un rendu déterministe: ${src}`);
  }
  const absolutePath = assetPath(src, baseDirectory);
  const cached = state.fileCache.get(absolutePath);
  if (cached) return cached;
  const pending = (async () => {
    const fileStat = await stat(absolutePath).catch(() => {
      throw new Error(`Asset local illisible: ${absolutePath}`);
    });
    if (!fileStat.isFile()) throw new Error(`L'asset local n'est pas un fichier: ${absolutePath}`);
    reserveBytes(state, absolutePath, fileStat.size);
    const data = await readFile(absolutePath);
    return `data:${mimeType(absolutePath)};base64,${data.toString("base64")}`;
  })();
  state.fileCache.set(absolutePath, pending);
  try {
    return await pending;
  } catch (error) {
    state.fileCache.delete(absolutePath);
    throw error;
  }
}

async function hydrateValue(value: unknown, baseDirectory: string, state: HydrationState): Promise<unknown> {
  if (Array.isArray(value)) return Promise.all(value.map((item) => hydrateValue(item, baseDirectory, state)));
  if (!isRecord(value)) return value;
  const hydrated = await Promise.all(
    Object.entries(value).map(async ([key, item]) => {
      if (key !== "src" || typeof item !== "string") {
        return [key, await hydrateValue(item, baseDirectory, state)] as const;
      }
      return [key, await hydrateSource(item, baseDirectory, state)] as const;
    }),
  );
  return Object.fromEntries(hydrated);
}

async function hydrateUsedRegistryEntries(
  value: unknown,
  usedIds: ReadonlySet<string>,
  baseDirectory: string,
  state: HydrationState,
): Promise<unknown> {
  if (!Array.isArray(value)) return value;
  return Promise.all(value.map(async (entry) => {
    if (!isRecord(entry) || typeof entry.id !== "string" || !usedIds.has(entry.id)
      || typeof entry.src !== "string") return entry;
    return { ...entry, src: await hydrateSource(entry.src, baseDirectory, state) };
  }));
}

export async function hydrateAssetsWithLimits(
  dossier: Dossier,
  inputPath: string,
  limits: AssetHydrationLimits,
): Promise<Dossier> {
  const state: HydrationState = {
    dataUris: new Set(),
    fileCache: new Map(),
    limits,
    totalBytes: 0,
  };
  const baseDirectory = resolve(inputPath, "..");
  const usedIds = new Set(collectDossierAssetUsages(dossier).flatMap((usage) =>
    usage.id === null ? [] : [usage.id],
  ));
  const [theme, slides, assets] = await Promise.all([
    hydrateValue(dossier.theme, baseDirectory, state),
    hydrateValue(dossier.slides, baseDirectory, state),
    hydrateUsedRegistryEntries(dossier.assets, usedIds, baseDirectory, state),
  ]);
  const hydrated: unknown = { ...dossier, theme, slides, assets };
  assertDossier(hydrated);
  return hydrated;
}

export async function hydrateAssets(dossier: Dossier, inputPath: string): Promise<Dossier> {
  return hydrateAssetsWithLimits(dossier, inputPath, DEFAULT_ASSET_HYDRATION_LIMITS);
}

export function resolveAsset(src: string, inputPath: string): string {
  return assetPath(src, resolve(inputPath, ".."));
}
