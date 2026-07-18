import { useEffect, useState, type CSSProperties } from "react";
import type { Dossier } from "./schema/types.js";
import { SlideRenderer } from "./components/SlideRenderer.js";
import { themeStyle } from "./theme.js";

const deckWidth = 2064;

function viewportScale(): number {
  if (typeof window === "undefined") return 1;
  if (new URLSearchParams(window.location.search).has("render")) return 1;
  return Math.min(1, Math.max(.12, (window.innerWidth - 24) / deckWidth));
}

export function App({ dossier }: { dossier: Dossier }) {
  const [scale, setScale] = useState(viewportScale);
  useEffect(() => {
    const update = () => setScale(viewportScale());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  useEffect(() => {
    const previousLanguage = document.documentElement.lang;
    document.documentElement.lang = dossier.meta.language;
    return () => {
      document.documentElement.lang = previousLanguage;
    };
  }, [dossier.meta.language]);
  const fullHeight = 64 + dossier.slides.length * 1414 + (dossier.slides.length - 1) * 32;
  const shellStyle: CSSProperties = { height: fullHeight * scale, width: deckWidth * scale };
  const deckStyle = { ...themeStyle(dossier.theme), transform: `scale(${scale})` };
  return (
    <div className="preview-shell" style={shellStyle}>
      <main className="deck" style={deckStyle} data-dossier-title={dossier.meta.title} lang={dossier.meta.language}>
        {dossier.slides.map((slide, index) => (
          <SlideRenderer
            index={index}
            key={slide.id}
            slide={slide}
            theme={dossier.theme}
            total={dossier.slides.length}
          />
        ))}
      </main>
    </div>
  );
}
