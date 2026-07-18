import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { exampleDossier } from "./content/example";
import { assertDossier } from "./schema/validation";
import "./styles.css";

declare global {
  interface Window {
    __DOSSIER_DATA__?: unknown;
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable.");

const content: unknown = window.__DOSSIER_DATA__ ?? exampleDossier;
assertDossier(content);

createRoot(root).render(
  <StrictMode>
    <App dossier={content} />
  </StrictMode>,
);
