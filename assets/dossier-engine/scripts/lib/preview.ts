import type { Plugin } from "vite";
import type { Dossier } from "../../src/schema/types";

export function parsePreviewInput(argv: readonly string[]): string {
  if (argv.some((argument) => argument.startsWith("--"))) {
    throw new Error("preview accepte uniquement un chemin de dossier .ts ou .json.");
  }
  if (argv.length > 1) throw new Error("preview accepte un seul fichier d'entrée.");
  return argv[0] ?? "src/content/example.ts";
}

export function createPreviewDataScript(dossier: Dossier): string {
  const payload = JSON.stringify(dossier)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return `window.__DOSSIER_DATA__=${payload};`;
}

export function previewDataPlugin(dossier: Dossier): Plugin {
  return {
    name: "prospect-dossier-preview-data",
    transformIndexHtml: {
      order: "pre",
      handler: () => [{
        tag: "script",
        children: createPreviewDataScript(dossier),
        injectTo: "head-prepend",
      }],
    },
  };
}
