#!/usr/bin/env node
import path from "node:path";
import { optionFlag, optionValue, parseCli, requireSinglePositional } from "./cli.js";
import { errorMessage, isMainModule, UserInputError } from "./core.js";
import { prepareLogo, type Matte } from "./logo-processing.js";

export const PREPARE_LOGO_HELP = `prepare-logo <logo.svg|logo.png> [options]

Preserves the source byte-for-byte and writes transparent monochrome dark/light PNGs
plus report.json. Trims transparent space, then adds a measured margin.

Options:
  --out <directory>   Output directory (default: <logo>-prepared)
  --margin <0-0.5>    Margin per side as a content fraction (default: 0.12)
  --size <64-8192>    Target longest side including margin (default: 1600)
  --dark <#RRGGBB>    Dark variant colour (default: #111111)
  --light <#RRGGBB>   Light variant colour (default: #FFFFFF)
  --matte white|black Explicitly infer alpha from an opaque matte
  --matte-color <#RRGGBB>
                       Infer alpha from an arbitrary uniform colour matte
  --help              Show this help

Use either --matte or --matte-color. Colour-matte inference uses normalized RGB
distance. Edge inspection on both light and dark outputs is required. Raster
enlargement is reported as source-limited and never described as recovering detail.
`;

function parseMatte(value: string | undefined): Matte | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value !== "white" && value !== "black") {
    throw new UserInputError("Matte must be either white or black.");
  }
  return value;
}

export async function prepareLogoCli(arguments_: readonly string[]): Promise<number> {
  try {
    const parsed = parseCli(arguments_, {
      help: "boolean",
      out: "value",
      margin: "value",
      size: "value",
      dark: "value",
      light: "value",
      matte: "value",
      "matte-color": "value",
    });
    if (optionFlag(parsed.options, "help")) {
      process.stdout.write(PREPARE_LOGO_HELP);
      return 0;
    }
    const inputPath = requireSinglePositional(parsed.positionals, "prepare-logo <logo.svg|logo.png> [options]");
    const extension = path.extname(inputPath);
    const outputDirectory = optionValue(parsed.options, "out")
      ?? path.join(path.dirname(inputPath), `${path.basename(inputPath, extension)}-prepared`);
    const marginText = optionValue(parsed.options, "margin");
    const sizeText = optionValue(parsed.options, "size");
    const matte = parseMatte(optionValue(parsed.options, "matte"));
    const matteColor = optionValue(parsed.options, "matte-color");
    const report = await prepareLogo({
      inputPath,
      outputDirectory,
      marginFraction: marginText === undefined ? 0.12 : Number(marginText),
      outputLongestSide: sizeText === undefined ? 1600 : Number(sizeText),
      ...(matte === undefined ? {} : { matte }),
      ...(matteColor === undefined ? {} : { matteColor }),
      darkColor: optionValue(parsed.options, "dark") ?? "#111111",
      lightColor: optionValue(parsed.options, "light") ?? "#FFFFFF",
    });
    process.stdout.write(`Prepared ${report.outputs.dark.file} and ${report.outputs.light.file} in ${path.resolve(outputDirectory)}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`prepare-logo: ${errorMessage(error)}\n`);
    return 1;
  }
}

if (isMainModule(import.meta.url)) {
  process.exitCode = await prepareLogoCli(process.argv.slice(2));
}
