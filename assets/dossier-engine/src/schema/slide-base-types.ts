import type { CompositionFamily, VisualIntent } from "./profile-types.js";
import type { ImageAsset, SlideTone } from "./theme-types.js";

export type ClaimKind = "fact" | "quote" | "observation" | "interpretation" | "proposal";

export interface ClaimRef {
  text: string;
  kind: ClaimKind;
  contentPath: string;
  evidenceIds?: readonly string[];
}

export interface BaseSlide {
  id: string;
  visualIntent?: VisualIntent;
  visualIntentRationale?: string;
  compositionFamily?: CompositionFamily;
  visualPeak?: boolean;
  eyebrow?: string;
  tone?: SlideTone;
  footer?: string;
  evidenceIds?: readonly string[];
  claims?: readonly ClaimRef[];
  relationshipLabel?: string;
  motifState?: "default" | "full" | "quiet" | "hidden";
  chapterMark?: ImageAsset;
  backgroundField?: "cover" | "body";
}
