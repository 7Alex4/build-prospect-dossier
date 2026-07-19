export type SlideTone = "paper" | "ink" | "accent" | "surface" | "signal";

export type MediaRole =
  | "hero"
  | "evidence"
  | "editorial"
  | "product"
  | "portrait"
  | "film-still"
  | "storyboard-frame"
  | "reference"
  | "background"
  | "motif"
  | "identity";

export type MediaNature =
  | "photograph"
  | "product-cutout"
  | "screenshot"
  | "document"
  | "archive"
  | "illustration"
  | "storyboard"
  | "portrait"
  | "texture"
  | "brand-mark";

export type MediaProductionStatus = "final" | "placeholder";

export type FontRole = "display" | "body" | "mono";
export type FontStyle = "normal" | "italic";
export type FontWeight = 400 | 500 | 600 | 700 | 800 | 900;

export interface PixelDimensions {
  height: number;
  width: number;
}

export interface SubjectSafeBox {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface SystemFontSource {
  kind: "system";
  allowedResolvedFamilies: readonly string[];
  license: string;
}

export interface LocalFontSource {
  kind: "local";
  file: string;
  format: "woff2" | "woff" | "otf" | "ttf";
  sha256: string;
  license: string;
}

export interface FontFaceContract {
  role: FontRole;
  family: string;
  style: FontStyle;
  weights: readonly FontWeight[];
  source: SystemFontSource | LocalFontSource;
}

export interface ImageAsset {
  id: string;
  src: string;
  alt: string;
  fit?: "cover" | "contain";
  position?: string;
  treatment?: "natural" | "mono" | "duotone";
  credit?: string;
  mediaRole?: MediaRole;
  mediaNature?: MediaNature;
  productionStatus?: MediaProductionStatus;
  presentation?: "frame" | "cutout" | "background";
  sourceDimensions?: PixelDimensions;
  subjectSafeBox?: SubjectSafeBox;
}

export interface MotifPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MotifConfig {
  kind: "frame" | "orbit" | "grid" | "signal" | "asset" | "none";
  derivation?: "prospect-derived" | "typographic-system" | "generic";
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
    faces?: readonly FontFaceContract[];
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
