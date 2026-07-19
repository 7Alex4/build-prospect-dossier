# Prospect dossier tools

## Prepare an opaque logo

`prepare-logo` preserves the supplied source and creates transparent dark and light
PNG variants. A source that already contains transparency needs no matte option.

Use the named compatibility option for a uniform white or black background:

```sh
corepack pnpm prepare-logo -- logo.png --matte white
```

Use `--matte-color` for any other uniform background colour:

```sh
corepack pnpm prepare-logo -- logo.png --matte-color '#EC1018'
```

The two matte options are mutually exclusive. The colour must use the exact
six-digit `#RRGGBB` form.

### Alpha inference

Colour-matte removal assumes one uniform matte and a monochrome logo with some
fully opaque pixels. For each pixel, the tool measures normalized RGB distance to
the declared matte:

```text
d(pixel, matte) = sqrt(sum(((pixelChannel - matteChannel) / 255)^2))
alpha = clamp(d(pixel, matte) / referenceDistance, 0, 1)
```

The reference distance is the median of the highest-distance 10% of non-matte
pixels. This keeps one noisy outlier from defining opacity while preserving the
solid portion of a normal monochrome mark.

This reconstruction cannot prove the original edge blend. Inspection of fine
edges on both light and dark backgrounds is required before an asset is approved.
The generated `report.json` records the matte, method and reference distance.
