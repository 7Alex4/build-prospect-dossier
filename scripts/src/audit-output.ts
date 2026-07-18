#!/usr/bin/env node
import path from "node:path";
import { optionFlag, optionValue, parseCli, requireSinglePositional } from "./cli.js";
import { errorMessage, isMainModule } from "./core.js";
import { auditOutput } from "./output-audit.js";

export const AUDIT_OUTPUT_HELP = `audit-output <slides-directory> [options]

Checks that final pages are non-empty, numbered contiguously from 1, exactly
2000×1414, PNG, sRGB and opaque without an alpha channel. audit.json records each
page's SHA-256, format, colour space and channel metadata. A supplied PDF is decoded
with pdf-lib, its page count must match the image count, and every MediaBox must be
A4 landscape at 841.89×595.28 pt within ±0.2 pt. Filename and SHA-256 markers must
match the ordered PNGs. Poppler pdftoppm then rasterises the actual PDF pages so
their visual content is compared independently against that final PNG sequence.
Set PDFTOPPM_PATH when pdftoppm is not available on PATH.

Recognised page names start with a number (01-title.png) or end with one
(page-01.png). JPEG and WebP candidates are inspected but rejected as final pages;
generated contact sheets are ignored.

Options:
  --out <directory>   Output directory (default: <slides>/audit)
  --pdf <file.pdf>    Validate and visually compare an assembled PDF (requires Poppler)
  --render-report <file.json>
                      Validate a full final render report (default: sibling of PDF)
  --help              Show this help
`;

export async function auditOutputCli(arguments_: readonly string[]): Promise<number> {
  try {
    const parsed = parseCli(arguments_, {
      help: "boolean",
      out: "value",
      pdf: "value",
      "render-report": "value",
    });
    if (optionFlag(parsed.options, "help")) {
      process.stdout.write(AUDIT_OUTPUT_HELP);
      return 0;
    }
    const pagesDirectory = requireSinglePositional(parsed.positionals, "audit-output <slides-directory> [options]");
    const outputDirectory = optionValue(parsed.options, "out") ?? path.join(pagesDirectory, "audit");
    const pdfPath = optionValue(parsed.options, "pdf");
    const renderReportPath = optionValue(parsed.options, "render-report");
    const report = await auditOutput({
      pagesDirectory,
      outputDirectory,
      ...(pdfPath === undefined ? {} : { pdfPath }),
      ...(renderReportPath === undefined ? {} : { renderReportPath }),
    });
    process.stdout.write(`${report.status.toUpperCase()}: ${report.pageCount} page image(s); report at ${path.resolve(outputDirectory, "audit.json")}\n`);
    return report.status === "pass" ? 0 : 1;
  } catch (error) {
    process.stderr.write(`audit-output: ${errorMessage(error)}\n`);
    return 1;
  }
}

if (isMainModule(import.meta.url)) {
  process.exitCode = await auditOutputCli(process.argv.slice(2));
}
