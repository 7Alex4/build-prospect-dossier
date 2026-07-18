import type { ReactNode } from "react";
import type { BrandTheme, DossierSlide } from "../schema/types";
import {
  SlideBackground,
  SlideChapterMark,
  SlideMotif,
  SlidePageMarker,
  SlideRunningHeader,
} from "./SlideDecor";

interface SlideFrameProps {
  children: ReactNode;
  index: number;
  slide: DossierSlide;
  theme: BrandTheme;
  total: number;
}

function BrandMark({ theme }: { theme: BrandTheme }) {
  if (theme.logo.wordmark) {
    return <img className="brand-wordmark" src={theme.logo.wordmark.src} alt={theme.logo.wordmark.alt} />;
  }
  return <span className="brand-fallback">{theme.logo.textFallback}</span>;
}

export function SlideFrame({ children, index, slide, theme, total }: SlideFrameProps) {
  const page = String(index + 1).padStart(2, "0");
  const tone = slide.tone ?? "paper";
  const footerMode = theme.chrome?.footer ?? "bordered";
  return (
    <section
      className={`slide slide--${tone} slide-type--${slide.type}`}
      data-slide-id={slide.id}
      data-slide-type={slide.type}
      id={`slide-${page}`}
    >
      <SlideBackground theme={theme} tone={tone} />
      <SlideMotif slide={slide} theme={theme} />
      <SlideRunningHeader slide={slide} theme={theme} />
      <SlideChapterMark slide={slide} />
      <div className="slide__content">{children}</div>
      {footerMode !== "hidden" ? (
        <footer className={`slide__footer slide__footer--${footerMode}`}>
          <BrandMark theme={theme} />
          {slide.footer ? <span>{slide.footer}</span> : <span aria-hidden="true" />}
          <SlidePageMarker index={index} theme={theme} total={total} />
        </footer>
      ) : null}
    </section>
  );
}
