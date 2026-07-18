import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: false,
    emptyOutDir: false,
    lib: {
      cssFileName: "dossier-engine",
      entry: "src/library.ts",
      fileName: "dossier-engine",
      formats: ["es"],
      name: "DossierEngine",
    },
    outDir: "dist/lib",
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
    target: "es2022",
  },
});
