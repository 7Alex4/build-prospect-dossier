import type { CSSProperties, ReactNode } from "react";
import type { ImageAsset } from "../schema/types";

interface AssetImageProps {
  asset: ImageAsset;
  className?: string;
  decorative?: boolean;
}

export function AssetImage({ asset, className = "", decorative = false }: AssetImageProps) {
  const style: CSSProperties = {
    objectFit: asset.fit ?? "cover",
    objectPosition: asset.position ?? "center",
  };
  return (
    <figure
      aria-hidden={decorative ? "true" : undefined}
      className={`asset ${className}`}
      data-fit
      data-treatment={asset.treatment ?? "natural"}
    >
      <img
        alt={decorative ? "" : asset.alt}
        data-asset-source={asset.src}
        onError={(event) => {
          event.currentTarget.dataset.missing = "true";
        }}
        src={asset.src}
        style={style}
      />
      {asset.credit ? <figcaption>{asset.credit}</figcaption> : null}
    </figure>
  );
}

interface HeadingProps {
  eyebrow?: string | undefined;
  title: string;
  intro?: string | undefined;
  compact?: boolean;
}

export function SectionHeading({ eyebrow, title, intro, compact = false }: HeadingProps) {
  return (
    <header className={`section-heading ${compact ? "section-heading--compact" : ""}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 data-fit>{title}</h1>
      {intro ? <p className="intro" data-fit>{intro}</p> : null}
    </header>
  );
}

interface IndexLabelProps {
  index: string | number;
  children?: ReactNode;
}

export function IndexLabel({ index, children }: IndexLabelProps) {
  return (
    <div className="index-label">
      <span>{String(index).padStart(2, "0")}</span>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function Pills({ items }: { items: readonly string[] }) {
  return (
    <ul className="pills">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 64 24" aria-hidden="true">
      <path d="M0 12h58M48 2l10 10-10 10" />
    </svg>
  );
}
