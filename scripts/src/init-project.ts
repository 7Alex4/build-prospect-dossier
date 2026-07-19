#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import path from "node:path";
import { optionFlag, optionValue, parseCli, requireSinglePositional } from "./cli.js";
import { errorMessage, isMainModule, UserInputError } from "./core.js";
import { initProject } from "./project-scaffold.js";
import type { ScaffoldProfile } from "./project-workflow-files.js";

export const INIT_PROJECT_HELP = `init-project <target-directory> [options]

Copies the sibling assets/dossier-engine template and creates a production job with:
brief.yaml, evidence and asset ledgers, a claim map, observations, source notes,
strategy documents, QA report, raw/processed asset folders and output/slides.

Client content: init-project does not create brand.ts, evidence.ts or deck.ts.
Create those files after research, platform selection and page mapping.
Template exclusions: caches, dist, rendered outputs, transient .test-input-* directories,
node_modules and browser binaries.
Existing workflow documents are preserved when --force is used.

Options:
  --force                              Allow a non-empty target explicitly
  --template <directory>               Override the sibling dossier-engine template
  --profile <neutral|black-flower>     Select authorship profile (default: neutral)
  --authorize-generative-assets <ref>  Record the explicit authorization reference
  --generative-assets-authorized-by <name>
                                       Record who granted authorization
  --help                               Show this help
`;

export function defaultTemplateDirectory(importMetaUrl = import.meta.url): string {
  return path.resolve(path.dirname(fileURLToPath(importMetaUrl)), "../../assets/dossier-engine");
}

export async function initProjectCli(arguments_: readonly string[]): Promise<number> {
  try {
    const parsed = parseCli(arguments_, {
      "authorize-generative-assets": "value",
      force: "boolean",
      "generative-assets-authorized-by": "value",
      help: "boolean",
      profile: "value",
      template: "value",
    });
    if (optionFlag(parsed.options, "help")) {
      process.stdout.write(INIT_PROJECT_HELP);
      return 0;
    }
    const targetDirectory = requireSinglePositional(parsed.positionals, "init-project <target-directory> [options]");
    const authorizationReference = optionValue(parsed.options, "authorize-generative-assets");
    const authorizedBy = optionValue(parsed.options, "generative-assets-authorized-by");
    const rawProfile = optionValue(parsed.options, "profile") ?? "neutral";
    if (rawProfile !== "neutral" && rawProfile !== "black-flower") {
      throw new UserInputError("--profile must be neutral or black-flower.");
    }
    const profile: ScaffoldProfile = rawProfile;
    if ((authorizationReference === undefined) !== (authorizedBy === undefined)) {
      throw new UserInputError(
        "--authorize-generative-assets and --generative-assets-authorized-by must be provided together.",
      );
    }
    const generativeAssetAuthorization = authorizationReference !== undefined && authorizedBy !== undefined
      ? { authorizedBy, reference: authorizationReference }
      : undefined;
    const result = await initProject({
      targetDirectory,
      templateDirectory: optionValue(parsed.options, "template") ?? defaultTemplateDirectory(),
      force: optionFlag(parsed.options, "force"),
      profile,
      ...(generativeAssetAuthorization ? { generativeAssetAuthorization } : {}),
    });
    process.stdout.write(`Initialised ${result.targetDirectory} with ${result.copiedTemplateFiles} engine file(s) and ${result.createdWorkflowFiles.length} workflow file(s).\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`init-project: ${errorMessage(error)}\n`);
    return 1;
  }
}

if (isMainModule(import.meta.url)) {
  process.exitCode = await initProjectCli(process.argv.slice(2));
}
