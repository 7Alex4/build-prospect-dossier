export interface CliOptions {
  inputPath: string;
  outputPath: string;
  slides?: readonly string[];
}

export function parseArgs(argv: readonly string[], defaultOutput = "rendered"): CliOptions {
  const positional: string[] = [];
  let outputPath = defaultOutput;
  let slides: readonly string[] | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--out") {
      const value = argv[index + 1];
      if (!value) throw new Error("--out attend un chemin.");
      outputPath = value;
      index += 1;
    } else if (argument === "--slides") {
      const value = argv[index + 1];
      if (!value) throw new Error("--slides attend des numéros ou identifiants séparés par des virgules.");
      slides = value.split(",").map((item) => item.trim()).filter(Boolean);
      index += 1;
    } else if (argument?.startsWith("--")) {
      throw new Error(`Option inconnue: ${argument}`);
    } else if (argument) {
      positional.push(argument);
    }
  }
  const options: CliOptions = { inputPath: positional[0] ?? "src/content/example.ts", outputPath };
  if (slides) return { ...options, slides };
  return options;
}
