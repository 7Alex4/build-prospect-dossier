import type { DistributionMode } from "./asset-types.js";
import type { FrameworkProfile, StudioIdentity } from "./profile-types.js";

export interface GenerativeAssetAuthorization {
  status: "explicitly-authorized";
  authorizedBy: string;
  reference: string;
}

export interface DossierMeta {
  title: string;
  client: string;
  frameworkProfile: FrameworkProfile;
  studio?: string;
  studioIdentity?: StudioIdentity;
  language: string;
  version: string;
  date: string;
  distributionMode: DistributionMode;
  relationshipStatus: "independent-proposal" | "client-approved" | "commissioned";
  generativeAssets: "forbidden" | "authorized";
  generativeAssetsAuthorization?: GenerativeAssetAuthorization;
  campaignMode?: "focused-opportunity" | "campaign-platform";
  creativeRouteCount?: number;
  stage: "draft" | "final";
  forbiddenClientTerms?: readonly string[];
  confidential?: boolean;
}
