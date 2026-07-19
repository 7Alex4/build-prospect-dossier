import assert from "node:assert/strict";
import test from "node:test";
import { applyNormalizedMatteRemoval, parseHexColor } from "../src/matte-removal.js";

function blend(
  matte: readonly [number, number, number],
  foreground: readonly [number, number, number],
  alpha: number,
): readonly [number, number, number] {
  return [
    Math.round(matte[0] * (1 - alpha) + foreground[0] * alpha),
    Math.round(matte[1] * (1 - alpha) + foreground[1] * alpha),
    Math.round(matte[2] * (1 - alpha) + foreground[2] * alpha),
  ];
}

test("normalized matte distance reconstructs monochrome edge opacity", () => {
  const matte = parseHexColor("#EC1018", "Matte").rgb;
  const foreground = [255, 255, 255] as const;
  const half = blend(matte, foreground, 0.5);
  const pixels = Uint8Array.from([
    ...matte, 255,
    ...half, 255,
    ...foreground, 255,
    ...foreground, 255,
  ]);

  const stats = applyNormalizedMatteRemoval(pixels, matte);

  assert.equal(pixels[3], 0);
  assert.ok((pixels[7] ?? 0) >= 126 && (pixels[7] ?? 0) <= 129);
  assert.equal(pixels[11], 255);
  assert.equal(pixels[15], 255);
  assert.ok(stats.referenceDistance > 0);
  assert.equal(stats.nonMattePixelCount, 3);
});

test("reference distance resists a single high-distance outlier", () => {
  const matte = [236, 16, 24] as const;
  const logo = [255, 255, 255] as const;
  const outlier = [0, 255, 255] as const;
  const source = [
    ...Array.from({ length: 100 }, () => [...logo, 255]).flat(),
    ...outlier,
    255,
  ];
  const pixels = Uint8Array.from(source);

  applyNormalizedMatteRemoval(pixels, matte);

  assert.equal(pixels[3], 255);
  assert.equal(pixels[99 * 4 + 3], 255);
});

test("uniform matte without a visible mark fails", () => {
  const matte = [12, 34, 56] as const;
  const pixels = Uint8Array.from([...matte, 255, ...matte, 255]);
  assert.throws(() => applyNormalizedMatteRemoval(pixels, matte), /no contrasting logo pixels/);
});
