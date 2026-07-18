import type {
  ArchitectureSlide,
  CoverSlide,
  ManifestoSlide,
  ThreeColumnsSlide,
} from "../../schema/types";
import { Arrow, AssetImage, IndexLabel, SectionHeading } from "../primitives";

function CoverTextVisual({ slide }: { slide: CoverSlide }) {
  return (
    <div className="cover-text-visual">
      <span>{slide.tag ?? "Proposition"}</span>
      <strong>{slide.proposition}</strong>
      <p>{slide.subtitle}</p>
    </div>
  );
}

export function Cover({ slide }: { slide: CoverSlide }) {
  return (
    <div className="cover-layout">
      <div className="cover-copy">
        <p className="eyebrow">{slide.eyebrow ?? slide.client}</p>
        {slide.relationshipLabel ? (
          <p className="cover-relationship" data-fit>{slide.relationshipLabel}</p>
        ) : null}
        <h1 data-fit>{slide.title}</h1>
        <p className="cover-subtitle" data-fit>{slide.subtitle}</p>
        <div className="cover-proposition">
          <span>{slide.tag ?? "Proposition"}</span>
          <p data-fit>{slide.proposition}</p>
        </div>
      </div>
      <div className="cover-visual">
        {slide.image ? <AssetImage asset={slide.image} /> : <CoverTextVisual slide={slide} />}
      </div>
    </div>
  );
}

export function Architecture({ slide }: { slide: ArchitectureSlide }) {
  return (
    <div className={`architecture-layout ${slide.image ? "architecture-layout--image" : ""}`}>
      <div className="architecture-copy">
        <SectionHeading eyebrow={slide.eyebrow} title={slide.title} intro={slide.statement} compact />
        <div className="architecture-map">
          {slide.nodes.map((node, index) => (
            <div className={`architecture-node architecture-node--${node.kind ?? "core"}`} key={node.label}>
              <IndexLabel index={index + 1} />
              <h2 data-fit>{node.label}</h2>
              <p data-fit>{node.detail}</p>
              {index < slide.nodes.length - 1 ? <Arrow /> : null}
            </div>
          ))}
        </div>
        <div className="architecture-axis">
          <span />
          <p>{slide.axisLabel ?? "Un système cohérent, du signal à l'impact"}</p>
          <span />
        </div>
      </div>
      {slide.image ? <AssetImage asset={slide.image} className="architecture-image" /> : null}
    </div>
  );
}

export function ThreeColumns({ slide }: { slide: ThreeColumnsSlide }) {
  return (
    <div className="columns-layout">
      <SectionHeading eyebrow={slide.eyebrow} title={slide.title} intro={slide.intro} compact />
      <div className="columns-grid">
        {slide.columns.map((column, index) => (
          <article className="column-card" key={column.title}>
            <IndexLabel index={column.index ?? index + 1}>{column.signal}</IndexLabel>
            <h2 data-fit>{column.title}</h2>
            <p data-fit>{column.body}</p>
          </article>
        ))}
      </div>
      {slide.conclusion ? <p className="columns-conclusion" data-fit>{slide.conclusion}</p> : null}
    </div>
  );
}

export function Manifesto({ slide }: { slide: ManifestoSlide }) {
  return (
    <div className={`manifesto-layout ${slide.image ? "manifesto-layout--image" : ""}`}>
      <div className="manifesto-copy">
        <p className="eyebrow">{slide.eyebrow ?? "Manifeste"}</p>
        <h1 data-fit>{slide.title}</h1>
        <div className="manifesto-lines">
          {slide.lines.map((line, index) => (
            <p data-fit key={`${index}-${line}`}><span>{String(index + 1).padStart(2, "0")}</span>{line}</p>
          ))}
        </div>
        {slide.closing ? <p className="manifesto-closing" data-fit>{slide.closing}</p> : null}
      </div>
      {slide.image ? <AssetImage asset={slide.image} className="manifesto-image" /> : null}
    </div>
  );
}
