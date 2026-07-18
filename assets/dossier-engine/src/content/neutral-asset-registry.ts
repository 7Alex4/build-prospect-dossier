import type { AssetRecord, ImageAsset } from "../schema/types";
import {
  neutralMotifFull,
  neutralMotifQuiet,
  neutralPageMarker,
  neutralProofImage,
  neutralRiskImage,
  neutralStoryboardImage,
  neutralStudioPortrait,
  neutralSurfaceBackground,
} from "./neutral-assets";

const shippingScopes = ["private-prospecting", "client-project", "public"] as const;

function approvedFixture(asset: ImageAsset): AssetRecord {
  return {
    id: asset.id,
    src: asset.src,
    origin: "studio-created",
    rightsBasis: "Original neutral fixture distributed under this package's MIT license.",
    status: "approved",
    allowedDistributionScopes: shippingScopes,
  };
}

const storyboardAssets = Array.from({ length: 10 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return neutralStoryboardImage(number, "Fixture neutre");
});

export const neutralAssetRegistry: readonly AssetRecord[] = [
  neutralProofImage,
  neutralRiskImage,
  neutralStudioPortrait,
  neutralMotifFull,
  neutralMotifQuiet,
  neutralPageMarker,
  neutralSurfaceBackground,
  ...storyboardAssets,
].map(approvedFixture);
