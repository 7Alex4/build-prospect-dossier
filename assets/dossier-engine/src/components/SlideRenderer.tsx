import type { BrandTheme, DossierSlide } from "../schema/types.js";
import { SlideFrame } from "./SlideFrame";
import { Lockup, ThankYou } from "./slides/ClosingSlides";
import { FilmConcept, References, Storyboard } from "./slides/FilmSlides";
import { Activation, Production, Timeline } from "./slides/PlanningSlides";
import { Opportunity, Platform, Proof, Risk } from "./slides/StrategySlides";
import { Architecture, Cover, Manifesto, ThreeColumns } from "./slides/StructuralSlides";

interface SlideRendererProps {
  index: number;
  slide: DossierSlide;
  theme: BrandTheme;
  total: number;
}

function slideContent(slide: DossierSlide) {
  switch (slide.type) {
    case "cover": return <Cover slide={slide} />;
    case "architecture": return <Architecture slide={slide} />;
    case "three-columns": return <ThreeColumns slide={slide} />;
    case "manifesto": return <Manifesto slide={slide} />;
    case "proof": return <Proof slide={slide} />;
    case "risk": return <Risk slide={slide} />;
    case "opportunity": return <Opportunity slide={slide} />;
    case "platform": return <Platform slide={slide} />;
    case "timeline": return <Timeline slide={slide} />;
    case "film-concept": return <FilmConcept slide={slide} />;
    case "activation": return <Activation slide={slide} />;
    case "storyboard": return <Storyboard slide={slide} />;
    case "production": return <Production slide={slide} />;
    case "references": return <References slide={slide} />;
    case "thank-you": return <ThankYou slide={slide} />;
    case "lockup": return <Lockup slide={slide} />;
  }
}

export function SlideRenderer({ index, slide, theme, total }: SlideRendererProps) {
  return (
    <SlideFrame index={index} slide={slide} theme={theme} total={total}>
      {slideContent(slide)}
    </SlideFrame>
  );
}
