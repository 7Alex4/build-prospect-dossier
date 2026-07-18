import { stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_PIXELS,
  round,
  sha256File,
  toPosixPath,
  UserInputError,
} from "./core.js";

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

interface ColorBucket {
  red: number;
  green: number;
  blue: number;
  weight: number;
}

function displayedDimensions(
  width: number,
  height: number,
  orientation: number | undefined,
): { width: number; height: number } {
  return orientation !== undefined && orientation >= 5 && orientation <= 8
    ? { width: height, height: width }
    : { width, height };
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0").toUpperCase();
}

async function measurePalette(filePath: string, limit: number): Promise<readonly PaletteColor[]> {
  const { data, info } = await sharp(filePath, { density: 144, limitInputPixels: MAX_IMAGE_PIXELS })
    .rotate()
    .resize(96, 96, { fit: "inside", withoutEnlargement: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const buckets = new Map<number, ColorBucket>();
  let totalWeight = 0;
  for (let offset = 0; offset < data.length; offset += info.channels) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const alpha = data[offset + 3];
    if (red === undefined || green === undefined || blue === undefined || alpha === undefined || alpha <= 16) {
      continue;
    }
    const weight = alpha / 255;
    const key = (Math.floor(red / 32) << 6) | (Math.floor(green / 32) << 3) | Math.floor(blue / 32);
    const bucket = buckets.get(key) ?? { red: 0, green: 0, blue: 0, weight: 0 };
    bucket.red += red * weight;
    bucket.green += green * weight;
    bucket.blue += blue * weight;
    bucket.weight += weight;
    totalWeight += weight;
    buckets.set(key, bucket);
  }
  if (totalWeight === 0) {
    return [];
  }
  return [...buckets.entries()]
    .sort(([leftKey, left], [rightKey, right]) => right.weight - left.weight || leftKey - rightKey)
    .slice(0, limit)
    .map(([, bucket]) => ({
      hex: `#${toHex(bucket.red / bucket.weight)}${toHex(bucket.green / bucket.weight)}${toHex(bucket.blue / bucket.weight)}`,
      coverage: round(bucket.weight / totalWeight, 4),
    }));
}

export async function analyzeImage(
  filePath: string,
  rootDirectory: string,
  paletteLimit: number,
): Promise<ImageInventoryEntry> {
  const fileStat = await stat(filePath);
  if (fileStat.size > MAX_IMAGE_BYTES) {
    throw new UserInputError(`Image exceeds the ${MAX_IMAGE_BYTES}-byte safety limit: ${filePath}`);
  }
  const [metadata, sha256, dominantPalette] = await Promise.all([
    sharp(filePath, { density: 144, limitInputPixels: MAX_IMAGE_PIXELS }).metadata(),
    sha256File(filePath),
    measurePalette(filePath, paletteLimit),
  ]);
  if (metadata.width === undefined || metadata.height === undefined || metadata.width === 0 || metadata.height === 0) {
    throw new UserInputError(`Image has no measurable dimensions: ${filePath}`);
  }
  const dimensions = displayedDimensions(metadata.width, metadata.height, metadata.orientation);
  return {
    path: toPosixPath(path.relative(rootDirectory, filePath)),
    format: metadata.format ?? path.extname(filePath).slice(1).toLowerCase(),
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio: round(dimensions.width / dimensions.height),
    orientation: metadata.orientation ?? null,
    bytes: fileStat.size,
    sha256,
    dominantPalette,
  };
}
