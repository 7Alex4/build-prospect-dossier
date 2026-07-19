import { round, UserInputError } from "./core.js";
const CHANNEL_MAX = 255;
const REFERENCE_TAIL_SHARE = 0.1;
export function parseHexColor(value, label) {
    const match = /^#([0-9a-f]{6})$/i.exec(value);
    const sourceHex = match?.[1];
    if (sourceHex === undefined) {
        throw new UserInputError(`${label} must be a six-digit hex colour such as #111111.`);
    }
    const hex = `#${sourceHex.toUpperCase()}`;
    return {
        hex,
        rgb: [
            Number.parseInt(sourceHex.slice(0, 2), 16),
            Number.parseInt(sourceHex.slice(2, 4), 16),
            Number.parseInt(sourceHex.slice(4, 6), 16),
        ],
    };
}
export function resolveMatteDefinition(matte, matteColor) {
    if (matte !== undefined && matteColor !== undefined) {
        throw new UserInputError("Use either --matte or --matte-color, not both.");
    }
    if (matteColor !== undefined) {
        const parsed = parseHexColor(matteColor, "Matte colour");
        return { ...parsed, reportValue: parsed.hex };
    }
    if (matte === undefined) {
        return undefined;
    }
    if (matte !== "white" && matte !== "black") {
        throw new UserInputError("Matte must be either white or black.");
    }
    const parsed = parseHexColor(matte === "white" ? "#FFFFFF" : "#000000", "Matte colour");
    return { ...parsed, reportValue: matte };
}
function normalizedDistance(red, green, blue, matte) {
    const redDelta = (red - matte[0]) / CHANNEL_MAX;
    const greenDelta = (green - matte[1]) / CHANNEL_MAX;
    const blueDelta = (blue - matte[2]) / CHANNEL_MAX;
    return Math.hypot(redDelta, greenDelta, blueDelta);
}
function median(values) {
    const middle = Math.floor(values.length / 2);
    const upper = values[middle];
    if (upper === undefined) {
        throw new UserInputError("The matte source contains no contrasting logo pixels.");
    }
    if (values.length % 2 === 1) {
        return upper;
    }
    const lower = values[middle - 1] ?? upper;
    return (lower + upper) / 2;
}
function robustReferenceDistance(distances) {
    const sorted = [...distances].sort((left, right) => left - right);
    const tailSize = Math.max(1, Math.ceil(sorted.length * REFERENCE_TAIL_SHARE));
    return median(sorted.slice(-tailSize));
}
export function applyNormalizedMatteRemoval(pixels, matte) {
    const distances = [];
    for (let offset = 0; offset < pixels.length; offset += 4) {
        const distance = normalizedDistance(pixels[offset] ?? 0, pixels[offset + 1] ?? 0, pixels[offset + 2] ?? 0, matte);
        if (distance > Number.EPSILON) {
            distances.push(distance);
        }
    }
    const referenceDistance = robustReferenceDistance(distances);
    if (referenceDistance <= Number.EPSILON) {
        throw new UserInputError("The matte source contains no contrasting logo pixels.");
    }
    for (let offset = 0; offset < pixels.length; offset += 4) {
        const distance = normalizedDistance(pixels[offset] ?? 0, pixels[offset + 1] ?? 0, pixels[offset + 2] ?? 0, matte);
        pixels[offset + 3] = Math.round(CHANNEL_MAX * Math.min(1, distance / referenceDistance));
    }
    return {
        referenceDistance: round(referenceDistance, 6),
        nonMattePixelCount: distances.length,
    };
}
//# sourceMappingURL=matte-removal.js.map