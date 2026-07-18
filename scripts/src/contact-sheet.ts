import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  IMAGE_CONCURRENCY,
  mapWithConcurrency,
  MAX_IMAGE_FILES,
  MAX_IMAGE_PIXELS,
  UserInputError,
} from "./core.js";

export interface ContactSheetItem {
  readonly filePath: string;
  readonly label: string;
  readonly subtitle?: string;
}

const CARD_WIDTH = 344;
const CARD_HEIGHT = 266;
const THUMB_WIDTH = 304;
const THUMB_HEIGHT = 190;
const HEADER_HEIGHT = 78;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function truncate(value: string, maximum = 42): string {
  return value.length <= maximum ? value : `${value.slice(0, maximum - 1)}…`;
}

export async function createContactSheet(
  items: readonly ContactSheetItem[],
  outputPath: string,
  title: string,
): Promise<void> {
  if (items.length > MAX_IMAGE_FILES) {
    throw new UserInputError(`Contact sheet exceeds the ${MAX_IMAGE_FILES}-image safety limit.`);
  }
  const columns = Math.min(4, Math.max(1, items.length));
  const rows = Math.max(1, Math.ceil(items.length / columns));
  const width = columns * CARD_WIDTH + 32;
  const height = HEADER_HEIGHT + rows * CARD_HEIGHT + 24;
  const cards = items.map((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = 16 + column * CARD_WIDTH;
    const y = HEADER_HEIGHT + row * CARD_HEIGHT;
    const subtitle = item.subtitle === undefined
      ? ""
      : `<text x="${x + 18}" y="${y + 242}" class="subtitle">${escapeXml(truncate(item.subtitle))}</text>`;
    return `<g>
      <rect x="${x + 6}" y="${y + 4}" width="${CARD_WIDTH - 12}" height="${CARD_HEIGHT - 12}" rx="8" class="card"/>
      <rect x="${x + 18}" y="${y + 16}" width="${THUMB_WIDTH}" height="${THUMB_HEIGHT}" rx="4" fill="url(#checker)"/>
      <text x="${x + 18}" y="${y + 224}" class="label">${escapeXml(truncate(item.label))}</text>
      ${subtitle}
    </g>`;
  }).join("\n");
  const emptyState = items.length === 0
    ? `<text x="${width / 2}" y="${HEADER_HEIGHT + 100}" text-anchor="middle" class="empty">No valid images</text>`
    : "";
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="#f5f3ee"/><path d="M0 0h8v8H0zM8 8h8v8H8z" fill="#e7e3da"/>
      </pattern>
      <style>
        .card{fill:#fff;stroke:#d4d0c7;stroke-width:1}.title{font:600 24px Arial,sans-serif;fill:#171717}
        .meta,.subtitle{font:12px Arial,sans-serif;fill:#6d6a64}.label{font:600 14px Arial,sans-serif;fill:#242321}
        .empty{font:16px Arial,sans-serif;fill:#77736c}
      </style>
    </defs>
    <rect width="100%" height="100%" fill="#ece9e2"/>
    <text x="24" y="34" class="title">${escapeXml(title)}</text>
    <text x="24" y="56" class="meta">${items.length} image${items.length === 1 ? "" : "s"}</text>
    ${cards}${emptyState}
  </svg>`);

  const thumbnails = await mapWithConcurrency(items, IMAGE_CONCURRENCY, async (item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const input = await sharp(item.filePath, { density: 144, limitInputPixels: MAX_IMAGE_PIXELS })
      .rotate()
      .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    return {
      input,
      left: 34 + column * CARD_WIDTH,
      top: HEADER_HEIGHT + row * CARD_HEIGHT + 16,
    };
  });
  await mkdir(path.dirname(outputPath), { recursive: true });
  await sharp({ create: { width, height, channels: 4, background: "#ece9e2" } })
    .composite([{ input: overlay, left: 0, top: 0 }, ...thumbnails])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}
