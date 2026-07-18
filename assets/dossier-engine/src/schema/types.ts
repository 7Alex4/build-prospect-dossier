import type { BrandTheme, ImageAsset, SlideTone } from "./theme-types.js";
import type { AssetRecord } from "./asset-types.js";
import type { CompositionFamily, VisualIntent } from "./profile-types.js";
import type { DossierMeta } from "./meta-types.js";

export type {
  BrandTheme,
  FontFaceContract,
  FontRole,
  FontStyle,
  FontWeight,
  ImageAsset,
  MediaNature,
  MediaProductionStatus,
  MediaRole,
  SlideTone,
} from "./theme-types.js";
export type { CompositionFamily, FrameworkProfile, StudioIdentity, VisualIntent } from "./profile-types.js";
export type { DossierMeta, GenerativeAssetAuthorization } from "./meta-types.js";
export type * from "./asset-types.js";

export type ClaimKind = "fact" | "quote" | "observation" | "interpretation" | "proposal";

export interface ClaimRef {
  text: string;
  kind: ClaimKind;
  contentPath: string;
  evidenceIds?: readonly string[];
}

export type EvidenceStatus =
  | "verified"
  | "official-only"
  | "needs-check"
  | "internal-only"
  | "rejected";

export interface EvidenceRecord {
  id: string;
  kind: ClaimKind;
  status: EvidenceStatus;
  claim: string;
  sourceUrl?: string;
}

interface BaseSlide {
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
}

export interface CoverSlide extends BaseSlide {
  type: "cover";
  client: string;
  title: string;
  subtitle: string;
  proposition: string;
  tag?: string;
  image?: ImageAsset;
}

export interface ArchitectureSlide extends BaseSlide {
  type: "architecture";
  title: string;
  statement: string;
  nodes: Array<{ label: string; detail: string; kind?: "input" | "core" | "output" }>;
  axisLabel?: string;
  image?: ImageAsset;
}

export interface ThreeColumnsSlide extends BaseSlide {
  type: "three-columns";
  variant: "why-now" | "pillars";
  title: string;
  intro?: string;
  columns: readonly [ContentColumn, ContentColumn, ContentColumn];
  conclusion?: string;
}

export interface ContentColumn {
  index?: string;
  title: string;
  body: string;
  signal?: string;
}

export interface ManifestoSlide extends BaseSlide {
  type: "manifesto";
  title: string;
  lines: readonly string[];
  closing?: string;
  image?: ImageAsset;
}

export interface ProofSlide extends BaseSlide {
  type: "proof";
  title: string;
  metrics?: readonly Metric[];
  quote?: string;
  source?: string;
  proofPoints?: readonly string[];
  image?: ImageAsset;
}

export interface Metric {
  value: string;
  label: string;
  context?: string;
}

export interface RiskSlide extends BaseSlide {
  type: "risk";
  title: string;
  lead: string;
  risks: readonly RiskItem[];
  counterpoint?: string;
  image?: ImageAsset;
}

export interface RiskItem {
  label: string;
  consequence: string;
  severity: 1 | 2 | 3;
}

export interface OpportunitySlide extends BaseSlide {
  type: "opportunity";
  variant: "opportunity" | "shifts";
  title: string;
  lead?: string;
  shifts: readonly Shift[];
  image?: ImageAsset;
}

export interface Shift {
  from: string;
  to: string;
  implication: string;
}

export interface PlatformSlide extends BaseSlide {
  type: "platform";
  variant: "platform" | "system";
  title: string;
  core: { label: string; detail: string };
  layers: ReadonlyArray<{ label: string; detail: string }>;
  outcomes?: readonly string[];
  image?: ImageAsset;
}

export interface TimelineSlide extends BaseSlide {
  type: "timeline";
  variant: "timeline" | "method";
  title: string;
  steps: readonly TimelineStep[];
  image?: ImageAsset;
}

export interface TimelineStep {
  phase: string;
  duration: string;
  title: string;
  detail: string;
  deliverable?: string;
  image?: ImageAsset;
}

export interface FilmConceptSlide extends BaseSlide {
  type: "film-concept";
  title: string;
  conceptName: string;
  logline: string;
  format: string;
  duration: string;
  toneWords: readonly string[];
  image?: ImageAsset;
  productCutout?: ImageAsset;
}

export interface ActivationSlide extends BaseSlide {
  type: "activation";
  title: string;
  lead: string;
  channels: ReadonlyArray<{ name: string; role: string; asset: string }>;
  sequence?: readonly string[];
  image?: ImageAsset;
}

export interface StoryboardSlide extends BaseSlide {
  type: "storyboard";
  title: string;
  frames: readonly StoryboardFrame[];
  duration?: string;
}

export interface StoryboardFrame {
  number: string;
  beat: string;
  visual: string;
  onScreen?: string;
  audio?: string;
  timecode?: string;
  image?: ImageAsset;
}

export interface ProductionSlide extends BaseSlide {
  type: "production";
  title: string;
  lead: string;
  workstreams: ReadonlyArray<{ name: string; detail: string; owner?: string }>;
  deliverables: readonly string[];
  constraints?: readonly string[];
  image?: ImageAsset;
}

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

export interface ThankYouSlide extends BaseSlide {
  type: "thank-you";
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

export interface LockupSlide extends BaseSlide {
  type: "lockup";
  title?: string;
  statement?: string;
  client: string;
  studio?: string;
  mark?: ImageAsset;
  textMark?: string;
  legal?: string;
}

export type DossierSlide =
  | CoverSlide
  | ArchitectureSlide
  | ThreeColumnsSlide
  | ManifestoSlide
  | ProofSlide
  | RiskSlide
  | OpportunitySlide
  | PlatformSlide
  | TimelineSlide
  | FilmConceptSlide
  | ActivationSlide
  | StoryboardSlide
  | ProductionSlide
  | ReferencesSlide
  | ThankYouSlide
  | LockupSlide;

export interface Dossier {
  meta: DossierMeta;
  evidence: readonly EvidenceRecord[];
  assets: readonly AssetRecord[];
  theme: BrandTheme;
  slides: readonly DossierSlide[];
}
