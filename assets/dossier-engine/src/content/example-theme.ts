import type { BrandTheme } from "../schema/types";
import {
  neutralMotifFull,
  neutralMotifQuiet,
  neutralPageMarker,
  neutralSurfaceBackground,
} from "./neutral-assets";

export const exampleTheme = {
  name: "Signal minéral",
  palette: {
    ink: "#171815",
    paper: "#F2F0E9",
    accent: "#E7FF3C",
    muted: "#777A70",
    surface: "#D9D7CE",
    signal: "#4055E6",
  },
  typography: {
    display: "Arial, Helvetica, sans-serif",
    body: "Arial, Helvetica, sans-serif",
    mono: "Menlo, Monaco, monospace",
    faces: [
      {
        role: "display",
        family: "Arial",
        style: "normal",
        weights: [400, 700],
        source: {
          kind: "system",
          allowedResolvedFamilies: ["Arial", "ArialMT", "Liberation Sans", "Arimo"],
          license: "Police système de l'environnement de rendu, fixture technique uniquement.",
        },
      },
      {
        role: "body",
        family: "Arial",
        style: "normal",
        weights: [400, 700],
        source: {
          kind: "system",
          allowedResolvedFamilies: ["Arial", "ArialMT", "Liberation Sans", "Arimo"],
          license: "Police système de l'environnement de rendu, fixture technique uniquement.",
        },
      },
      {
        role: "mono",
        family: "Menlo",
        style: "normal",
        weights: [400, 700],
        source: {
          kind: "system",
          allowedResolvedFamilies: ["Menlo", "Monaco", "Liberation Mono", "DejaVu Sans Mono"],
          license: "Police système de l'environnement de rendu, fixture technique uniquement.",
        },
      },
    ],
  },
  motif: {
    kind: "asset",
    density: "quiet",
    strokeWidth: 2,
    cornerRadius: 0,
    showIndex: false,
    assets: {
      full: neutralMotifFull,
      quiet: neutralMotifQuiet,
    },
    placement: { x: 1516, y: 64, width: 400, height: 400 },
  },
  logo: { textFallback: "PROSPECT DÉMO" },
  backgrounds: { surface: neutralSurfaceBackground },
  pageMarker: {
    kind: "rotating-asset",
    asset: neutralPageMarker,
    startAngle: 0,
    stepAngle: 12,
  },
  chrome: {
    footer: "minimal",
    runningHeader: {
      text: "Prospect Démo · Proposition narrative",
      align: "right",
      showOnCover: false,
    },
  },
} satisfies BrandTheme;
