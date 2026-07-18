import type {
  OpportunitySlide,
  PlatformSlide,
  ProofSlide,
  RiskSlide,
} from "../../schema/types";
import { Arrow, AssetImage, IndexLabel, SectionHeading } from "../primitives";

export function Proof({ slide }: { slide: ProofSlide }) {
  const classes = [
    "proof-layout",
    slide.image ? "proof-layout--image" : "",
    !slide.metrics ? "proof-layout--points-only" : "",
  ].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      <SectionHeading eyebrow={slide.eyebrow} title={slide.title} compact />
      <div className="proof-body">
        <div className="proof-main">
          {slide.metrics ? (
            <div className={`metrics-grid metrics-grid--${slide.metrics.length}`}>
              {slide.metrics.map((metric) => (
                <article className="metric" key={`${metric.value}-${metric.label}`}>
                  <strong data-fit>{metric.value}</strong>
                  <h2 data-fit>{metric.label}</h2>
                  {metric.context ? <p data-fit>{metric.context}</p> : null}
                </article>
              ))}
            </div>
          ) : null}
          {slide.quote ? (
            <blockquote className="proof-quote">
              <p data-fit>« {slide.quote} »</p>
              {slide.source ? <cite>{slide.source}</cite> : null}
            </blockquote>
          ) : null}
          {slide.proofPoints ? (
            <ul className="proof-points">
              {slide.proofPoints.map((point) => <li data-fit key={point}>{point}</li>)}
            </ul>
          ) : null}
        </div>
        {slide.image ? <AssetImage asset={slide.image} className="proof-image" /> : null}
      </div>
    </div>
  );
}

function Severity({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span
      aria-label={`Sévérité ${level} sur 3`}
      aria-valuemax={3}
      aria-valuemin={1}
      aria-valuenow={level}
      className="severity"
      role="meter"
    >
      {[1, 2, 3].map((step) => (
        <i aria-hidden="true" className={step <= level ? "is-active" : ""} key={step} />
      ))}
    </span>
  );
}

export function Risk({ slide }: { slide: RiskSlide }) {
  return (
    <div className={`risk-layout ${slide.image ? "risk-layout--image" : ""}`}>
      <SectionHeading eyebrow={slide.eyebrow} title={slide.title} intro={slide.lead} compact />
      <div className="risk-body">
        <div className="risk-main">
          <div className="risk-list">
            {slide.risks.map((risk, index) => (
              <article className="risk-row" key={risk.label}>
                <IndexLabel index={index + 1} />
                <h2 data-fit>{risk.label}</h2>
                <p data-fit>{risk.consequence}</p>
                <Severity level={risk.severity} />
              </article>
            ))}
          </div>
          {slide.counterpoint ? <p className="counterpoint" data-fit>{slide.counterpoint}</p> : null}
        </div>
        {slide.image ? <AssetImage asset={slide.image} className="risk-image" /> : null}
      </div>
    </div>
  );
}

export function Opportunity({ slide }: { slide: OpportunitySlide }) {
  return (
    <div className={`opportunity-layout ${slide.image ? "opportunity-layout--image" : ""}`}>
      <SectionHeading eyebrow={slide.eyebrow} title={slide.title} intro={slide.lead} compact />
      <div className="opportunity-body">
        <div className="shift-grid">
          {slide.shifts.map((shift, index) => (
            <article className="shift-card" key={`${shift.from}-${shift.to}`}>
              <IndexLabel index={index + 1} />
              <div className="shift-change">
                <p data-fit>{shift.from}</p>
                <Arrow />
                <h2 data-fit>{shift.to}</h2>
              </div>
              <p className="shift-implication" data-fit>{shift.implication}</p>
            </article>
          ))}
        </div>
        {slide.image ? <AssetImage asset={slide.image} className="opportunity-image" /> : null}
      </div>
    </div>
  );
}

export function Platform({ slide }: { slide: PlatformSlide }) {
  return (
    <div className={`platform-layout ${slide.image ? "platform-layout--image" : ""}`}>
      <SectionHeading eyebrow={slide.eyebrow} title={slide.title} compact />
      <div className="platform-system">
        <div className="platform-core">
          <span>{slide.variant}</span>
          <h2 data-fit>{slide.core.label}</h2>
          <p data-fit>{slide.core.detail}</p>
        </div>
        <div className="platform-layers">
          {slide.layers.map((layer, index) => (
            <article className="platform-layer" key={layer.label}>
              <IndexLabel index={index + 1} />
              <div><h3 data-fit>{layer.label}</h3><p data-fit>{layer.detail}</p></div>
            </article>
          ))}
        </div>
        {slide.image ? <AssetImage asset={slide.image} className="platform-image" /> : null}
      </div>
      {slide.outcomes ? (
        <ul className="platform-outcomes">
          {slide.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
