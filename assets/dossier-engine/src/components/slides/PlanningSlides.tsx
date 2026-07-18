import type { ActivationSlide, ProductionSlide, TimelineSlide } from "../../schema/types";
import { AssetImage, IndexLabel, SectionHeading } from "../primitives";

export function Timeline({ slide }: { slide: TimelineSlide }) {
  const imageSequence = slide.steps.some((step) => step.image);
  return (
    <div className={`timeline-layout ${slide.image ? "timeline-layout--image" : ""}`}>
      <SectionHeading eyebrow={slide.eyebrow} title={slide.title} compact />
      <div className="timeline-body">
        {slide.image ? <AssetImage asset={slide.image} className="timeline-image" /> : null}
        <div className={`timeline-track ${imageSequence ? "timeline-track--image-sequence" : ""}`}>
          {slide.steps.map((step, index) => (
            <article className="timeline-step" key={`${step.phase}-${step.title}`}>
              {step.image ? <AssetImage asset={step.image} className="timeline-step-image" /> : null}
              <div className="timeline-meta">
                <IndexLabel index={index + 1}>{step.phase}</IndexLabel>
                <span data-fit>{step.duration}</span>
              </div>
              <h2 data-fit>{step.title}</h2>
              <p data-fit>{step.detail}</p>
              {step.deliverable ? <strong data-fit>{step.deliverable}</strong> : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Activation({ slide }: { slide: ActivationSlide }) {
  return (
    <div className={`activation-layout ${slide.image ? "activation-layout--image" : ""}`}>
      <div className="activation-main">
        <SectionHeading eyebrow={slide.eyebrow} title={slide.title} intro={slide.lead} compact />
        <div className="activation-channels">
          {slide.channels.map((channel, index) => (
            <article className="channel" key={channel.name}>
              <IndexLabel index={index + 1} />
              <h2 data-fit>{channel.name}</h2>
              <p data-fit>{channel.role}</p>
              <strong data-fit>{channel.asset}</strong>
            </article>
          ))}
        </div>
      </div>
      {slide.image ? <AssetImage asset={slide.image} className="activation-image" /> : null}
      {slide.sequence ? (
        <ol className="activation-sequence">
          {slide.sequence.map((item) => <li data-fit key={item}>{item}</li>)}
        </ol>
      ) : null}
    </div>
  );
}

export function Production({ slide }: { slide: ProductionSlide }) {
  return (
    <div className={`production-layout ${slide.image ? "production-layout--image" : ""}`}>
      <SectionHeading eyebrow={slide.eyebrow} title={slide.title} intro={slide.lead} compact />
      <div className="production-grid">
        {slide.image ? <AssetImage asset={slide.image} className="production-image" /> : null}
        <div className="workstreams">
          {slide.workstreams.map((stream, index) => (
            <article className="workstream" key={stream.name}>
              <IndexLabel index={index + 1}>{stream.owner}</IndexLabel>
              <h2 data-fit>{stream.name}</h2>
              <p data-fit>{stream.detail}</p>
            </article>
          ))}
        </div>
        <aside className="deliverables">
          <p className="eyebrow">Livrables</p>
          <ul>{slide.deliverables.map((item) => <li data-fit key={item}>{item}</li>)}</ul>
          {slide.constraints ? (
            <div className="constraints">
              <p className="eyebrow">Contraintes</p>
              <ul>{slide.constraints.map((item) => <li data-fit key={item}>{item}</li>)}</ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
