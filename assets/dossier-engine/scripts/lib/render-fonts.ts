import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import type { Page } from "playwright";
import type { BrandTheme, FontFaceContract, FontRole, FontStyle, FontWeight } from "../../src/schema/types";

const MAX_FONT_BYTES = 32 * 1024 * 1024;
const FONT_PROBE_TEXT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸŒ àâäçéèêëîïôöùûüÿœ 0123456789 .,;:!?%+−/()[] CHF";

interface PreparedFontFace {
  readonly allowedResolvedFamilies: readonly string[];
  readonly family: string;
  readonly license: string;
  readonly role: FontRole;
  readonly sourceFile: string | null;
  readonly sourceKind: "local" | "system";
  readonly sourceSha256: string;
  readonly stack: string;
  readonly style: FontStyle;
  readonly weight: FontWeight;
}

export interface PreparedFontContract {
  readonly contract: readonly FontFaceContract[];
  readonly contractSha256: string;
  readonly css: string;
  readonly faces: readonly PreparedFontFace[];
}

export interface RenderFontTrace {
  readonly family: string;
  readonly isCustomFont: boolean;
  readonly license: string;
  readonly postScriptName: string;
  readonly resolvedFamily: string;
  readonly role: FontRole;
  readonly sourceFile: string | null;
  readonly sourceKind: "local" | "system";
  readonly sourceSha256: string;
  readonly style: FontStyle;
  readonly weight: FontWeight;
}

export interface RenderFontAudit {
  readonly contract: readonly FontFaceContract[];
  readonly contractSha256: string;
  readonly faces: readonly RenderFontTrace[];
}

function hash(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (typeof value !== "object" || value === null) return JSON.stringify(value) ?? "null";
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

export function fontContractSha256(theme: BrandTheme): string {
  return hash(canonical(theme.typography.faces ?? []));
}

function faceKey(face: Pick<RenderFontTrace, "role" | "family" | "style" | "weight">): string {
  return `${face.role}:${face.family}:${face.style}:${face.weight}`;
}

export function assertRenderFontAudit(theme: BrandTheme, audit: RenderFontAudit): void {
  if (audit.contractSha256 !== fontContractSha256(theme)) throw new Error("Empreinte du contrat de fontes invalide.");
  if (hash(canonical(audit.contract)) !== audit.contractSha256) throw new Error("Contrat de fontes du rapport altéré.");
  const expected = new Set((theme.typography.faces ?? []).flatMap((face) =>
    face.weights.map((weight) => faceKey({ ...face, weight })),
  ));
  const actual = audit.faces.map(faceKey);
  if (actual.length !== expected.size || new Set(actual).size !== actual.length
    || actual.some((key) => !expected.has(key))) {
    throw new Error("L'audit de fontes ne couvre pas chaque rôle, style et graisse déclarés.");
  }
}

function fontMime(format: string): string {
  if (format === "woff2") return "font/woff2";
  if (format === "woff") return "font/woff";
  if (format === "otf") return "font/otf";
  return "font/ttf";
}

function localPath(file: string, inputPath: string): string {
  const base = dirname(resolve(inputPath));
  const absolute = resolve(base, file);
  const fromBase = relative(base, absolute);
  if (fromBase.startsWith("..") || fromBase === "" || resolve(base, fromBase) !== absolute) {
    throw new Error(`Chemin de fonte hors du dossier source: ${file}`);
  }
  return absolute;
}

async function prepareFace(
  face: FontFaceContract,
  inputPath: string,
  stack: string,
): Promise<{ readonly css: string; readonly faces: readonly PreparedFontFace[] }> {
  let css = "";
  let sourceFile: string | null = null;
  let sourceSha256: string;
  let allowedResolvedFamilies: readonly string[];
  if (face.source.kind === "local") {
    const source = face.source;
    const absolute = localPath(source.file, inputPath);
    const fileStat = await stat(absolute).catch(() => {
      throw new Error(`Fonte locale illisible: ${source.file}`);
    });
    if (!fileStat.isFile() || fileStat.size > MAX_FONT_BYTES) {
      throw new Error(`Fonte locale invalide ou supérieure à ${MAX_FONT_BYTES} octets: ${source.file}`);
    }
    const data = await readFile(absolute);
    sourceSha256 = hash(data);
    if (sourceSha256 !== source.sha256) throw new Error(`Empreinte de fonte invalide: ${source.file}`);
    sourceFile = source.file;
    allowedResolvedFamilies = [face.family];
    const dataUri = `data:${fontMime(source.format)};base64,${data.toString("base64")}`;
    css = face.weights.map((weight) => `@font-face{font-family:${JSON.stringify(face.family)};src:url(${JSON.stringify(dataUri)}) format(${JSON.stringify(source.format)});font-style:${face.style};font-weight:${weight};font-display:block;}`).join("\n");
  } else {
    allowedResolvedFamilies = face.source.allowedResolvedFamilies;
    sourceSha256 = hash(canonical({ family: face.family, source: face.source }));
  }
  return {
    css,
    faces: face.weights.map((weight) => ({
      allowedResolvedFamilies,
      family: face.family,
      license: face.source.license,
      role: face.role,
      sourceFile,
      sourceKind: face.source.kind,
      sourceSha256,
      stack,
      style: face.style,
      weight,
    })),
  };
}

export async function prepareRenderFonts(theme: BrandTheme, inputPath: string): Promise<PreparedFontContract> {
  const contract = theme.typography.faces ?? [];
  const prepared = await Promise.all(contract.map((face) => prepareFace(face, inputPath, theme.typography[face.role])));
  return {
    contract,
    contractSha256: fontContractSha256(theme),
    css: prepared.flatMap((entry) => entry.css.length > 0 ? [entry.css] : []).join("\n"),
    faces: prepared.flatMap((entry) => entry.faces),
  };
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

export async function verifyRenderedFonts(page: Page, contract: PreparedFontContract): Promise<RenderFontAudit> {
  if (contract.css.length > 0) await page.addStyleTag({ content: contract.css });
  const checks = await page.evaluate(async ({ faces, probeText }) => {
    const host = document.createElement("div");
    host.id = "dossier-font-probes";
    host.style.cssText = "position:fixed;left:-10000px;top:0;opacity:0;pointer-events:none";
    faces.forEach((face, index) => {
      const probe = document.createElement("span");
      probe.id = `dossier-font-probe-${index}`;
      probe.textContent = probeText;
      probe.style.fontFamily = face.stack;
      probe.style.fontStyle = face.style;
      probe.style.fontWeight = String(face.weight);
      probe.style.fontSize = "32px";
      host.append(probe);
    });
    document.body.append(host);
    await document.fonts.ready;
    return Promise.all(faces.map(async (face) => {
      const shorthand = `${face.style} ${face.weight} 32px ${face.stack}`;
      await document.fonts.load(shorthand, probeText);
      return document.fonts.check(shorthand, probeText);
    }));
  }, { faces: contract.faces, probeText: FONT_PROBE_TEXT });
  const session = await page.context().newCDPSession(page);
  await session.send("DOM.enable");
  await session.send("CSS.enable");
  const documentNode = await session.send("DOM.getDocument");
  const traces: RenderFontTrace[] = [];
  for (const [index, face] of contract.faces.entries()) {
    if (checks[index] !== true) throw new Error(`Fonte non chargée: ${face.role} ${face.family} ${face.weight}.`);
    const selected = await session.send("DOM.querySelector", {
      nodeId: documentNode.root.nodeId,
      selector: `#dossier-font-probe-${index}`,
    });
    const platform = await session.send("CSS.getPlatformFontsForNode", { nodeId: selected.nodeId });
    const used = platform.fonts.filter((entry) => entry.glyphCount > 0);
    const resolved = [...used].sort((left, right) => right.glyphCount - left.glyphCount)[0];
    if (resolved === undefined || resolved.glyphCount === 0) throw new Error(`Fonte sans glyphes: ${face.family} ${face.weight}.`);
    const allowed = new Set(face.allowedResolvedFamilies.map(normalized));
    const forbidden = used.filter((entry) => !allowed.has(normalized(entry.familyName)));
    if (forbidden.length > 0) {
      throw new Error(`Fallback de fonte interdit pour ${face.role}: ${forbidden.map((entry) => entry.familyName).join(", ")}, attendu ${[...face.allowedResolvedFamilies].join(", ")}.`);
    }
    if (face.sourceKind === "local" && used.some((entry) => !entry.isCustomFont)) throw new Error(`La fonte locale ${face.family} n'est pas chargée comme webfont.`);
    if (face.sourceKind === "system" && used.some((entry) => entry.isCustomFont)) throw new Error(`La fonte système ${face.family} a été remplacée par une webfont.`);
    traces.push({
      family: face.family,
      isCustomFont: resolved.isCustomFont,
      license: face.license,
      postScriptName: resolved.postScriptName,
      resolvedFamily: resolved.familyName,
      role: face.role,
      sourceFile: face.sourceFile,
      sourceKind: face.sourceKind,
      sourceSha256: face.sourceSha256,
      style: face.style,
      weight: face.weight,
    });
  }
  await page.locator("#dossier-font-probes").evaluate((node) => node.remove());
  await session.detach();
  return { contract: contract.contract, contractSha256: contract.contractSha256, faces: traces };
}
