export type DistributionMode = "private-prospecting" | "client-project" | "public";

export type AssetOrigin =
  | "provided"
  | "official-site"
  | "press-kit"
  | "licensed-library"
  | "editorial"
  | "screenshot"
  | "studio-created"
  | "generated";

export type AssetRightsStatus = "approved" | "reference-only" | "unknown" | "rejected";

export interface AssetRecord {
  id: string;
  src?: string;
  ledgerId?: string;
  origin: AssetOrigin;
  rightsBasis: string;
  status: AssetRightsStatus;
  allowedDistributionScopes: readonly DistributionMode[];
}
