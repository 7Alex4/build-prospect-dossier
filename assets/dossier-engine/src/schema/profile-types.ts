import type { ImageAsset } from "./theme-types.js";

export type FrameworkProfile = "black-flower" | "neutral";
export type VisualIntent = "image-led" | "image-supported" | "typographic" | "diagram";

export const compositionFamilies = [
  "silent-cover",
  "editorial-split",
  "editorial-columns",
  "image-dominant",
  "object-overlap",
  "evidence-field",
  "typographic-manifesto",
  "editorial-sequence",
  "storyboard-grid",
  "reference-wall",
  "portrait-profile",
  "diagrammatic-system",
  "closing-letter",
  "lockup",
] as const;

export type CompositionFamily = typeof compositionFamilies[number];

export interface StudioIdentity {
  canonicalName: string;
  signature: string;
  mark?: ImageAsset;
  wordmark?: ImageAsset;
}
