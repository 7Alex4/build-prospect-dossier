import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { MAX_IMAGE_BYTES, MAX_IMAGE_PIXELS, round, sha256File, UserInputError, writeJson, } from "./core.js";
import { applyNormalizedMatteRemoval, parseHexColor, resolveMatteDefinition, } from "./matte-removal.js";
function transparencyStats(pixels) {
    let count = 0;
    const pixelCount = pixels.length / 4;
    for (let offset = 3; offset < pixels.length; offset += 4) {
        if (pixels[offset] !== 255) {
            count += 1;
        }
    }
    return { count, share: pixelCount === 0 ? 0 : round(count / pixelCount, 6) };
}
function visibleBounds(pixels, width, height) {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const alpha = pixels[(y * width + x) * 4 + 3];
            if (alpha !== undefined && alpha > 1) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }
    if (maxX < minX || maxY < minY) {
        throw new UserInputError("The source contains no visible pixels after transparency processing.");
    }
    return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}
function monochromePixels(source, color) {
    const output = Buffer.alloc(source.length);
    for (let offset = 0; offset < source.length; offset += 4) {
        output[offset] = color[0];
        output[offset + 1] = color[1];
        output[offset + 2] = color[2];
        output[offset + 3] = source[offset + 3] ?? 0;
    }
    return output;
}
async function writeMonochrome(pixels, width, height, color, outputPath) {
    await sharp(monochromePixels(pixels, color), { raw: { width, height, channels: 4 } })
        .png({ compressionLevel: 9 })
        .toFile(outputPath);
}
export async function prepareLogo(options) {
    const inputPath = path.resolve(options.inputPath);
    const extension = path.extname(inputPath).toLowerCase();
    if (extension !== ".png" && extension !== ".svg") {
        throw new UserInputError("Logo source must be a PNG or SVG file.");
    }
    const marginFraction = options.marginFraction ?? 0.12;
    const targetLongestSide = options.outputLongestSide ?? 1600;
    if (!Number.isFinite(marginFraction) || marginFraction < 0 || marginFraction > 0.5) {
        throw new UserInputError("Margin must be a number from 0 to 0.5.");
    }
    if (!Number.isInteger(targetLongestSide) || targetLongestSide < 64 || targetLongestSide > 8192) {
        throw new UserInputError("Output size must be an integer from 64 to 8192 pixels.");
    }
    const darkColor = parseHexColor(options.darkColor ?? "#111111", "Dark colour").rgb;
    const lightColor = parseHexColor(options.lightColor ?? "#FFFFFF", "Light colour").rgb;
    const matteDefinition = resolveMatteDefinition(options.matte, options.matteColor);
    const sourceStat = await stat(inputPath).catch(() => {
        throw new UserInputError(`Logo source is not readable: ${options.inputPath}`);
    });
    if (sourceStat.size > MAX_IMAGE_BYTES) {
        throw new UserInputError(`Logo exceeds the ${MAX_IMAGE_BYTES}-byte safety limit: ${options.inputPath}`);
    }
    const sourceBuffer = await readFile(inputPath);
    const sourceMetadata = await sharp(sourceBuffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
    const raster = extension === ".svg"
        ? sharp(sourceBuffer, { density: 300, limitInputPixels: MAX_IMAGE_PIXELS })
        : sharp(sourceBuffer, { limitInputPixels: MAX_IMAGE_PIXELS });
    const { data: decodedData, info: decodedInfo } = await raster.rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixels = Buffer.from(decodedData);
    const transparency = transparencyStats(pixels);
    const hasTransparentPixels = transparency.count > 0;
    if (!hasTransparentPixels && matteDefinition === undefined) {
        throw new UserInputError("Source has no transparent pixels. Supply a transparent source or explicitly use --matte white|black or --matte-color #RRGGBB.");
    }
    const matteRemoval = hasTransparentPixels ? null : (matteDefinition?.reportValue ?? null);
    const matteStats = hasTransparentPixels || matteDefinition === undefined
        ? null
        : applyNormalizedMatteRemoval(pixels, matteDefinition.rgb);
    if (matteRemoval !== null && matteStats === null) {
        throw new UserInputError("Matte removal could not be evaluated.");
    }
    const bounds = visibleBounds(pixels, decodedInfo.width, decodedInfo.height);
    const contentTarget = Math.max(1, Math.floor(targetLongestSide / (1 + marginFraction * 2)));
    const trimmedLongest = Math.max(bounds.width, bounds.height);
    const scaleFactor = contentTarget / trimmedLongest;
    const { data: resizedData, info: resizedInfo } = await sharp(pixels, {
        raw: { width: decodedInfo.width, height: decodedInfo.height, channels: 4 },
    }).extract(bounds).resize(contentTarget, contentTarget, { fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
    const marginPixels = Math.round(Math.max(resizedInfo.width, resizedInfo.height) * marginFraction);
    const { data: finalData, info: finalInfo } = await sharp(resizedData, {
        raw: { width: resizedInfo.width, height: resizedInfo.height, channels: 4 },
    }).extend({
        top: marginPixels,
        right: marginPixels,
        bottom: marginPixels,
        left: marginPixels,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
    }).raw().toBuffer({ resolveWithObject: true });
    const outputDirectory = path.resolve(options.outputDirectory);
    await mkdir(outputDirectory, { recursive: true });
    const stem = path.basename(inputPath, extension);
    const originalName = `${stem}.original${extension}`;
    const darkName = `${stem}.dark.png`;
    const lightName = `${stem}.light.png`;
    const originalPath = path.join(outputDirectory, originalName);
    if (originalPath === inputPath) {
        throw new UserInputError("Output would overwrite the source. Choose a different output directory.");
    }
    await copyFile(inputPath, originalPath);
    await writeMonochrome(finalData, finalInfo.width, finalInfo.height, darkColor, path.join(outputDirectory, darkName));
    await writeMonochrome(finalData, finalInfo.width, finalInfo.height, lightColor, path.join(outputDirectory, lightName));
    const aspectRatio = decodedInfo.width / decodedInfo.height;
    const warnings = [];
    if (aspectRatio < 0.1 || aspectRatio > 10) {
        warnings.push("Unusual source aspect ratio. Verify that the complete logo was supplied.");
    }
    if (matteDefinition !== undefined && hasTransparentPixels) {
        warnings.push("The matte option was not applied because the source already contains transparency.");
    }
    const rasterUpscaled = extension === ".png" && scaleFactor > 1;
    const notes = extension === ".svg"
        ? ["Vector source was rasterised for PNG delivery; the original SVG is preserved byte-for-byte."]
        : [
            "Raster output is derived from the supplied pixels; scaling does not recover detail or sharpness.",
            ...(rasterUpscaled ? ["The raster source was enlarged, so source-resolution limits remain visible."] : []),
        ];
    if (matteRemoval !== null) {
        notes.push(`Transparency was inferred from the declared ${matteRemoval} matte using normalized RGB distance. Edge inspection is required on both light and dark backgrounds.`);
    }
    const report = {
        schemaVersion: 1,
        status: "ok",
        source: {
            file: path.basename(inputPath),
            format: extension.slice(1),
            bytes: sourceBuffer.length,
            sha256: await sha256File(inputPath),
            width: sourceMetadata.width ?? decodedInfo.width,
            height: sourceMetadata.height ?? decodedInfo.height,
            aspectRatio: round(aspectRatio),
            hasAlphaChannel: sourceMetadata.hasAlpha ?? false,
            hasTransparentPixels,
            transparentPixelShare: transparency.share,
        },
        processing: {
            matteRemoval,
            matteColor: matteRemoval === null ? null : (matteDefinition?.hex ?? null),
            matteMethod: matteRemoval === null ? null : "normalized-rgb-distance",
            matteReferenceDistance: matteStats?.referenceDistance ?? null,
            marginFraction,
            targetLongestSide,
            trimmedDimensions: [bounds.width, bounds.height],
            contentDimensions: [resizedInfo.width, resizedInfo.height],
            outputDimensions: [finalInfo.width, finalInfo.height],
            scaleFactor: round(scaleFactor),
            rasterUpscaled,
        },
        sourceAssessment: {
            rating: extension === ".svg" ? "vector-source" : rasterUpscaled ? "limited-raster" : "native-resolution-raster",
            notes,
            warnings,
        },
        outputs: {
            original: { file: originalName, sha256: await sha256File(originalPath) },
            dark: { file: darkName, sha256: await sha256File(path.join(outputDirectory, darkName)) },
            light: { file: lightName, sha256: await sha256File(path.join(outputDirectory, lightName)) },
        },
    };
    await writeJson(path.join(outputDirectory, "report.json"), report);
    return report;
}
//# sourceMappingURL=logo-processing.js.map