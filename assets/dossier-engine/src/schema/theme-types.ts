export type SlideTone = "paper" | "ink" | "accent" | "surface" | "signal";

export interface ImageAsset {
  id: string;
  src: string;
  alt: string;
  fit?: "cover" | "contain";
  position?: string;
  treatment?: "natural" | "mono" | "duotone";
  credit?: string;
}

export interface MotifPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MotifConfig {
  kind: "frame" | "orbit" | "grid" | "signal" | "asset" | "none";
  density: "quiet" | "balanced" | "bold";
  strokeWidth: number;
  cornerRadius: number;
  showIndex: boolean;
  assets?: {
    full: ImageAsset;
    quiet?: ImageAsset;
  };
  placement?: MotifPlacement;
}

export interface PageMarkerConfig {
  kind: "number" | "rotating-asset" | "none";
  asset?: ImageAsset;
  startAngle?: number;
  stepAngle?: number;
}

export interface ThemeChrome {
  footer: "bordered" | "minimal" | "hidden";
  runningHeader?: {
    text: string;
    align: "left" | "center" | "right";
    showOnCover: boolean;
  };
}

export interface BrandTheme {
  name: string;
  palette: {
    ink: string;
    paper: string;
    accent: string;
    muted: string;
    surface: string;
    signal: string;
  };
  typography: {
    display: string;
    body: string;
    mono: string;
  };
  motif: MotifConfig;
  logo: {
    textFallback: string;
    mark?: ImageAsset;
    wordmark?: ImageAsset;
  };
  backgrounds?: Partial<Record<SlideTone, ImageAsset>>;
  pageMarker?: PageMarkerConfig;
  chrome?: ThemeChrome;
}
