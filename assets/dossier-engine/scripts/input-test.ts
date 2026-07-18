import assert from "node:assert/strict";
import { mkdtemp, open, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { AssetRecord, Dossier, ImageAsset } from "../src/schema/types";
import {
  DEFAULT_ASSET_HYDRATION_LIMITS,
  hydrateAssets,
  hydrateAssetsWithLimits,
} from "./lib/input";

function image(id: string, src: string): ImageAsset {
  return { id, src, alt: `Fixture ${id}` };
}

function record(id: string, src: string): AssetRecord {
  return {
    id,
    src,
    origin: "studio-created",
    rightsBasis: "Fixture de test locale.",
    status: "approved",
    allowedDistributionScopes: ["public"],
  };
}

function hydrationDossier(first: ImageAsset, second = first): Dossier {
  const records = first.id === second.id
    ? [record(first.id, first.src)]
    : [record(first.id, first.src), record(second.id, second.src)];
  return {
    meta: {
      title: "Fixture hydratation",
      client: "Prospect Démo",
      frameworkProfile: "neutral",
      language: "fr-CH",
      version: "1.0-test",
      date: "2026-07-18",
      distributionMode: "public",
      relationshipStatus: "client-approved",
      generativeAssets: "forbidden",
      stage: "draft",
    },
    evidence: [],
    assets: records,
    theme: {
      name: "Fixture",
      palette: {
        ink: "#111111",
        paper: "#FFFFFF",
        accent: "#AAFF00",
        muted: "#777777",
        surface: "#EEEEEE",
        signal: "#2244FF",
      },
      typography: { display: "Arial", body: "Arial", mono: "Menlo" },
      motif: {
        kind: "none",
        density: "quiet",
        strokeWidth: 0,
        cornerRadius: 0,
        showIndex: false,
      },
      logo: { textFallback: "PROSPECT DÉMO", mark: first },
    },
    slides: [{ id: "01-lockup", type: "lockup", client: "Prospect Démo", mark: second }],
  };
}

const directory = await mkdtemp(resolve(".test-input-"));
try {
  const sharedPath = join(directory, "shared.png");
  await writeFile(sharedPath, Buffer.alloc(100));
  const shared = hydrationDossier(image("asset:shared", "shared.png"));
  const hydrated = await hydrateAssetsWithLimits(shared, join(directory, "deck.ts"), {
    perAssetBytes: 120,
    totalBytes: 120,
  });
  assert.ok(hydrated.theme.logo.mark?.src.startsWith("data:image/png;base64,"));
  assert.equal(hydrated.theme.logo.mark?.src, hydrated.slides[0]?.type === "lockup" ? hydrated.slides[0].mark?.src : undefined);

  const withUnused: Dossier = {
    ...shared,
    assets: [...shared.assets, record("asset:unused", "missing-unused.png")],
  };
  const unusedHydrated = await hydrateAssetsWithLimits(withUnused, join(directory, "deck.ts"), {
    perAssetBytes: 120,
    totalBytes: 120,
  });
  assert.equal(unusedHydrated.assets.find((entry) => entry.id === "asset:unused")?.src, "missing-unused.png");

  const oversizedPath = join(directory, "oversized.png");
  const oversizedHandle = await open(oversizedPath, "w");
  await oversizedHandle.truncate(DEFAULT_ASSET_HYDRATION_LIMITS.perAssetBytes + 1);
  await oversizedHandle.close();
  const oversized = hydrationDossier(image("asset:oversized", "oversized.png"));
  await assert.rejects(() => hydrateAssets(oversized, join(directory, "deck.ts")), /Asset trop volumineux/);

  const dataUri = `data:image/svg+xml,${"x".repeat(80)}`;
  const inline = hydrationDossier(image("asset:inline", dataUri));
  await assert.rejects(() => hydrateAssetsWithLimits(inline, join(directory, "deck.ts"), {
    perAssetBytes: 64,
    totalBytes: 128,
  }), /Asset trop volumineux/);

  const firstPath = join(directory, "first.png");
  const secondPath = join(directory, "second.png");
  await Promise.all([
    writeFile(firstPath, Buffer.alloc(80)),
    writeFile(secondPath, Buffer.alloc(80)),
  ]);
  const cumulative = hydrationDossier(
    image("asset:first", "first.png"),
    image("asset:second", "second.png"),
  );
  await assert.rejects(() => hydrateAssetsWithLimits(cumulative, join(directory, "deck.ts"), {
    perAssetBytes: 100,
    totalBytes: 120,
  }), /Budget total des assets dépassé/);
} finally {
  await rm(directory, { force: true, recursive: true });
}

console.log("Tests hydratation: limites par asset, budget total et cache validés.");
