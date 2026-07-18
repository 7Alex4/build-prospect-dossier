import { resolve } from "node:path";
import { createServer as createViteServer } from "vite";
import { hydrateAssets, loadDossier } from "./lib/input";
import { parsePreviewInput, previewDataPlugin } from "./lib/preview";

async function preview(): Promise<void> {
  const inputPath = resolve(parsePreviewInput(process.argv.slice(2)));
  const dossier = await loadDossier(inputPath);
  const hydrated = await hydrateAssets(dossier, inputPath);
  const server = await createViteServer({
    configFile: resolve("vite.config.ts"),
    plugins: [previewDataPlugin(hydrated)],
    server: { host: "127.0.0.1" },
  });
  await server.listen();
  const url = server.resolvedUrls?.local[0] ?? "http://127.0.0.1:5173/";
  console.log(`Prévisualisation: ${url}`);
  console.log(`Dossier chargé: ${inputPath}`);
  console.log("Relancez preview après une modification du fichier de contenu. Les styles gardent le HMR Vite.");

  let closing = false;
  const close = async (): Promise<void> => {
    if (closing) return;
    closing = true;
    await server.close();
  };
  process.once("SIGINT", () => { void close(); });
  process.once("SIGTERM", () => { void close(); });
}

preview().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
