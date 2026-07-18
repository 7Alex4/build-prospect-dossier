import type { LockupSlide, ThankYouSlide } from "../../schema/types";
import { toSafeMailtoHref, toSafeTelHref, toSafeWebsiteHref } from "../../schema/contact-links";
import { AssetImage } from "../primitives";

export function ThankYou({ slide }: { slide: ThankYouSlide }) {
  const emailHref = slide.contact ? toSafeMailtoHref(slide.contact.email) : undefined;
  const phoneHref = slide.contact?.phone ? toSafeTelHref(slide.contact.phone) : undefined;
  const websiteHref = slide.contact?.website ? toSafeWebsiteHref(slide.contact.website) : undefined;
  const classes = [
    "thankyou-layout",
    slide.image ? "thankyou-layout--image" : "",
    slide.contact ? "thankyou-layout--contact" : "",
    !slide.image && !slide.contact ? "thankyou-layout--solo" : "",
  ].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      <div className="thankyou-main">
        <p className="eyebrow">{slide.eyebrow ?? "Prochaine étape"}</p>
        <h1 data-fit>{slide.title}</h1>
        <p data-fit>{slide.message}</p>
        {slide.nextStep ? <strong data-fit>{slide.nextStep}</strong> : null}
      </div>
      {slide.image ? <AssetImage asset={slide.image} className="thankyou-image" /> : null}
      {slide.contact ? (
        <address className="contact-card">
          <p>{slide.contact.name}</p>
          <span>{slide.contact.role}</span>
          {emailHref ? <a href={emailHref}>{slide.contact.email}</a> : <span>{slide.contact.email}</span>}
          {slide.contact.phone ? (
            phoneHref ? <a href={phoneHref}>{slide.contact.phone}</a> : <span>{slide.contact.phone}</span>
          ) : null}
          {slide.contact.website ? (
            websiteHref ? <a href={websiteHref}>{slide.contact.website}</a> : <span>{slide.contact.website}</span>
          ) : null}
        </address>
      ) : null}
    </div>
  );
}

export function Lockup({ slide }: { slide: LockupSlide }) {
  const silent = !slide.title && !slide.statement;
  const signature = [slide.studio, slide.legal].filter((item): item is string => Boolean(item));
  return (
    <div className={`lockup-layout ${silent ? "lockup-layout--silent" : ""}`}>
      {slide.mark ? <AssetImage asset={slide.mark} className="lockup-mark" /> : <span className="lockup-symbol" />}
      <p className="lockup-client">{slide.client}</p>
      {slide.title ? <h1 data-fit>{slide.title}</h1> : null}
      {slide.statement ? <p className="lockup-statement" data-fit>{slide.statement}</p> : null}
      {slide.relationshipLabel ? (
        <p className="lockup-relationship" data-fit>{slide.relationshipLabel}</p>
      ) : null}
      {signature.length > 0 ? (
        <div className="lockup-signature">{signature.map((item) => <span key={item}>{item}</span>)}</div>
      ) : null}
    </div>
  );
}
