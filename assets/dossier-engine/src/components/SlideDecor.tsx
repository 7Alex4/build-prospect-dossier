import type { CSSProperties } from "react";
import type { BrandTheme, DossierSlide, SlideTone } from "../schema/types";
import { AssetImage } from "./primitives";

export function SlideBackground({ theme, tone }: { theme: BrandTheme; tone: SlideTone }) {
  const asset = theme.backgrounds?.[tone];
  return asset ? <AssetImage asset={asset} className="slide-background" decorative /> : null;
}

function AssetMotif({ slide, theme }: { slide: DossierSlide; theme: BrandTheme }) {
  const assets = theme.motif.assets;
  if (!assets) return null;
  const requested = slide.motifState ?? "default";
  const state = requested === "default" && theme.motif.density === "quiet" ? "quiet" : requested;
  const quiet = state === "quiet";
  const asset = quiet ? assets.quiet ?? assets.full : assets.full;
  const placement = theme.motif.placement ?? { x: 0, y: 0, width: 2000, height: 1414 };
  const style: CSSProperties = {
    height: placement.height,
    left: placement.x,
    opacity: quiet && !assets.quiet ? .14 : 1,
    top: placement.y,
    width: placement.width,
  };
  return (
    <div className={`motif motif--asset motif--asset-${quiet ? "quiet" : "full"}`} style={style}>
      <AssetImage asset={asset} className="motif-asset-image" decorative />
    </div>
  );
}

export function SlideMotif({ slide, theme }: { slide: DossierSlide; theme: BrandTheme }) {
  const { kind } = theme.motif;
  if (kind === "none" || slide.motifState === "hidden") return null;
  if (kind === "asset") return <AssetMotif slide={slide} theme={theme} />;
  const density = slide.motifState === "full"
    ? "bold"
    : slide.motifState === "quiet"
      ? "quiet"
      : theme.motif.density;
  if (kind === "orbit") {
    return (
      <svg className={`motif motif--orbit motif--${density}`} viewBox="0 0 2000 1414" aria-hidden="true">
        <circle cx="1760" cy="180" r="280" />
        <circle cx="1760" cy="180" r="430" />
        <circle cx="1760" cy="180" r="580" />
      </svg>
    );
  }
  if (kind === "signal") {
    return (
      <svg className={`motif motif--signal motif--${density}`} viewBox="0 0 2000 1414" aria-hidden="true">
        <path d="M0 1100h340l110-190 170 330 180-530 160 390h1040" />
        <path d="M0 1160h520l100-170 160 250 180-320 100 240h940" />
      </svg>
    );
  }
  return <div className={`motif motif--${kind} motif--${density}`} aria-hidden="true" />;
}

export function SlideRunningHeader({ slide, theme }: { slide: DossierSlide; theme: BrandTheme }) {
  const header = theme.chrome?.runningHeader;
  if (!header || (slide.type === "cover" && !header.showOnCover)) return null;
  return <p className={`slide__running-header slide__running-header--${header.align}`} data-fit>{header.text}</p>;
}

export function SlideChapterMark({ slide }: { slide: DossierSlide }) {
  return slide.chapterMark ? <AssetImage asset={slide.chapterMark} className="chapter-mark" decorative /> : null;
}

interface PageMarkerProps {
  index: number;
  theme: BrandTheme;
  total: number;
}

export function SlidePageMarker({ index, theme, total }: PageMarkerProps) {
  const fallbackKind = theme.motif.showIndex ? "number" : "none";
  const marker = theme.pageMarker ?? { kind: fallbackKind };
  if (marker.kind === "none") return <span />;
  if (marker.kind === "number") {
    return <span className="page-marker page-marker--number">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>;
  }
  if (!marker.asset) return <span />;
  const angle = (marker.startAngle ?? 0) + index * (marker.stepAngle ?? 0);
  return (
    <span className="page-marker page-marker--asset" style={{ transform: `rotate(${angle}deg)` }}>
      <AssetImage asset={marker.asset} decorative />
    </span>
  );
}
