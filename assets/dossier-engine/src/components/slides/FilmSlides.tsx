import type { CSSProperties } from "react";
import type { FilmConceptSlide, ReferencesSlide, StoryboardSlide } from "../../schema/types";
import { AssetImage, IndexLabel, Pills, SectionHeading } from "../primitives";

function FilmTextVisual({ slide }: { slide: FilmConceptSlide }) {
  return (
    <div className="film-text-visual">
      <span data-fit>{slide.format}</span>
      <strong data-fit>{slide.conceptName}</strong>
      <p data-fit>{slide.duration}</p>
    </div>
  );
}

export function FilmConcept({ slide }: { slide: FilmConceptSlide }) {
  return (
    <div className="film-layout">
      <div className="film-visual">
        {slide.image ? <AssetImage asset={slide.image} /> : <FilmTextVisual slide={slide} />}
        {slide.productCutout ? <AssetImage asset={slide.productCutout} className="film-product-cutout" /> : null}
        <div className="film-format">
          <span data-fit>{slide.format}</span>
          <strong data-fit>{slide.duration}</strong>
        </div>
      </div>
      <div className="film-copy">
        <p className="eyebrow" data-fit>{slide.eyebrow ?? "Concept de film"}</p>
        <p className="film-kicker" data-fit>{slide.title}</p>
        <h1 data-fit>{slide.conceptName}</h1>
        <p className="film-logline" data-fit>{slide.logline}</p>
        <Pills items={slide.toneWords} />
      </div>
    </div>
  );
}

function StoryVisual({ frame }: { frame: StoryboardSlide["frames"][number] }) {
  if (frame.image) return <AssetImage asset={frame.image} />;
  return (
    <div className="story-draft-visual">
      <span data-fit>{frame.number}</span>
      <p data-fit>{frame.beat}</p>
      <small>Visuel de travail</small>
    </div>
  );
}

export function Storyboard({ slide }: { slide: StoryboardSlide }) {
  const dense = slide.frames.length > 6;
  const gridStyle: CSSProperties & { "--storyboard-columns": string } = {
    "--storyboard-columns": String(Math.ceil(slide.frames.length / 2)),
  };
  return (
    <div className="storyboard-layout">
      <SectionHeading eyebrow={slide.eyebrow} title={slide.title} compact />
      {slide.duration ? <p className="storyboard-duration" data-fit>Durée totale · {slide.duration}</p> : null}
      <div className={`storyboard-grid ${dense ? "storyboard-grid--dense" : ""}`} style={gridStyle}>
        {slide.frames.map((frame) => (
          <article className="story-frame" key={frame.number}>
            <StoryVisual frame={frame} />
            <div className="story-copy">
              <div>
                <strong data-fit>{frame.number}</strong>
                <h2 data-fit>{frame.beat}</h2>
                {frame.timecode ? <span className="story-timecode" data-fit>{frame.timecode}</span> : null}
              </div>
              <p data-fit>{frame.visual}</p>
              {frame.onScreen ? <span data-fit>Écran: {frame.onScreen}</span> : null}
              {frame.audio ? <span data-fit>Son: {frame.audio}</span> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function References({ slide }: { slide: ReferencesSlide }) {
  return (
    <div className="references-layout">
      <SectionHeading eyebrow={slide.eyebrow} title={slide.title} compact />
      <div className="references-grid">
        {slide.references.map((reference, index) => (
          <article className="reference" key={`${reference.title}-${index}`}>
            <div className="reference-visual">
              {reference.image ? (
                <AssetImage asset={reference.image} />
              ) : (
                <div className="reference-text-visual">
                  <strong data-fit>{reference.title}</strong>
                  <p data-fit>{reference.source}</p>
                </div>
              )}
              <IndexLabel index={index + 1} />
            </div>
            <h2 data-fit>{reference.title}</h2>
            <p data-fit>{reference.reason}</p>
            {reference.source ? <span data-fit>{reference.source}</span> : null}
          </article>
        ))}
      </div>
      {slide.note ? <p className="references-note" data-fit>{slide.note}</p> : null}
    </div>
  );
}
