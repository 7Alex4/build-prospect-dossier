import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (typeof value !== "object" || value === null) return JSON.stringify(value) ?? "null";
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

function fixtureFontAudit() {
  const contract = ["display", "body", "mono"].map((role) => ({
    role,
    family: "Fixture Sans",
    style: "normal",
    weights: [400, 700],
    source: {
      kind: "system",
      allowedResolvedFamilies: ["Fixture Sans"],
      license: "Fixture system font",
    },
  }));
  return {
    contract,
    contractSha256: sha256(canonical(contract)),
    faces: contract.flatMap((face) => face.weights.map((weight) => ({
      family: face.family,
      isCustomFont: false,
      license: face.source.license,
      postScriptName: "FixtureSans",
      resolvedFamily: "Fixture Sans",
      role: face.role,
      sourceFile: null,
      sourceKind: "system",
      sourceSha256: sha256(canonical({ family: face.family, source: face.source })),
      style: face.style,
      weight,
    }))),
  };
}

export async function writeCompleteRenderReport(
  reportPath: string,
  pdfPath: string,
  pagePaths: readonly string[],
  renderedSlideIds: readonly string[],
  sourcePath?: string,
): Promise<void> {
  const pages = await Promise.all(pagePaths.map(async (pagePath, index) => ({
    file: path.basename(pagePath),
    sha256: sha256(await readFile(pagePath)),
    slideId: renderedSlideIds[index] ?? "",
  })));
  const fixtureHash = sha256("render-report-fixture-source");
  const sourceBytes = sourcePath === undefined ? undefined : await readFile(sourcePath);
  const loadedSource = sourcePath === undefined
    ? undefined
    : JSON.parse(sourceBytes?.toString("utf8") ?? "null") as unknown;
  const sourceIntegrity = sourcePath === undefined
    ? { file: "deck.ts", sha256: fixtureHash, dossierSha256: fixtureHash }
    : {
      file: path.basename(sourcePath),
      sha256: sha256(sourceBytes ?? ""),
      dossierSha256: sha256(JSON.stringify(loadedSource)),
    };
  const report = {
    schemaVersion: "1.0",
    stage: "final",
    totalSlides: renderedSlideIds.length,
    renderedCount: renderedSlideIds.length,
    selectionApplied: false,
    selection: [],
    renderedSlideIds,
    dimensions: { height: 1414, width: 2000 },
    dossier: "Fixture dossier",
    evidenceRegistry: [],
    assetRegistry: [],
    fontAudit: fixtureFontAudit(),
    governance: {
      distributionMode: "private-prospecting",
      forbiddenClientTermsConfigured: 0,
      generativeAssets: "forbidden",
      generativeAssetsAuthorization: null,
      relationshipStatus: "independent-proposal",
      stage: "final",
    },
    integrity: {
      pages,
      pdf: { file: path.basename(pdfPath), sha256: sha256(await readFile(pdfPath)) },
      source: sourceIntegrity,
    },
    overflow: 0,
    pdfPage: { height: 595.28, unit: "pt", width: 841.89 },
    responsivePreview: [375, 1440],
    sourceVersion: "test",
    themeAssetIds: [],
    traceability: renderedSlideIds.map((slideId) => ({
      assetIds: [],
      claims: [],
      evidenceIds: [],
      slideId,
    })),
  };
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  await writeFile(reportPath, serialized, "utf8");
  const checksumPath = path.join(
    path.dirname(reportPath),
    `${path.basename(reportPath, path.extname(reportPath))}.sha256`,
  );
  await writeFile(checksumPath, `${sha256(serialized)}  ${path.basename(reportPath)}\n`, "utf8");
}
