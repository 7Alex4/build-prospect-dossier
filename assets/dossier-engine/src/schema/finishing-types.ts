import type { BaseSlide } from "./slide-base-types.js";
import type { ImageAsset } from "./theme-types.js";

export interface ProductionSystemSlide extends BaseSlide {
  type: "production";
  variant?: "system";
  title: string;
  lead: string;
  workstreams: ReadonlyArray<{ name: string; detail: string; owner?: string }>;
  deliverables: readonly string[];
  constraints?: readonly string[];
  image?: ImageAsset;
}

export interface BlackFlowerProductionSlide extends BaseSlide {
  type: "production";
  variant: "black-flower-portrait";
  title: string;
  lead: string;
  role: string;
  approach: readonly string[];
  strength: string;
  portraitCaption: string;
  image: ImageAsset;
}

export type ProductionSlide = ProductionSystemSlide | BlackFlowerProductionSlide;

export interface ReferencesSlide extends BaseSlide {
  type: "references";
  title: string;
  references: readonly ReferenceItem[];
  note?: string;
}

export interface ReferenceItem {
  title: string;
  reason: string;
  source: string;
  url?: string;
  image?: ImageAsset;
}

export interface StandardThankYouSlide extends BaseSlide {
  type: "thank-you";
  variant?: "cta";
  title: string;
  message: string;
  contact?: {
    name: string;
    role: string;
    email: string;
    phone?: string;
    website?: string;
  };
  nextStep?: string;
  image?: ImageAsset;
}

export interface BlackFlowerThankYouSlide extends BaseSlide {
  type: "thank-you";
  variant: "black-flower-letter";
  title: string;
  paragraphs: readonly string[];
  closing: string;
  signature: string;
  platform: string;
  image?: ImageAsset;
}

export type ThankYouSlide = StandardThankYouSlide | BlackFlowerThankYouSlide;

export interface StandardLockupSlide extends BaseSlide {
  type: "lockup";
  variant?: "standard";
  title?: string;
  statement?: string;
  client: string;
  studio?: string;
  mark?: ImageAsset;
  textMark?: string;
  legal?: string;
}

export interface BlackFlowerLockupSlide extends BaseSlide {
  type: "lockup";
  variant: "black-flower-co-mark";
  client: string;
  clientMark: ImageAsset;
  studioMark: ImageAsset;
  separator?: "gap" | "dot" | "times";
}

export type LockupSlide = StandardLockupSlide | BlackFlowerLockupSlide;
