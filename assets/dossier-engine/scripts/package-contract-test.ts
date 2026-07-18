import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const fixtureRoot = await mkdtemp(path.join(tmpdir(), "prospect-dossier-node-next-"));
const modulesRoot = path.join(fixtureRoot, "node_modules");
const directoryLinkType = process.platform === "win32" ? "junction" : "dir";

try {
  await mkdir(path.join(modulesRoot, "@types"), { recursive: true });
  await symlink(projectRoot, path.join(modulesRoot, "prospect-dossier-engine"), directoryLinkType);
  await symlink(
    path.join(projectRoot, "node_modules", "@types", "react"),
    path.join(modulesRoot, "@types", "react"),
    directoryLinkType,
  );
  await symlink(
    path.join(projectRoot, "node_modules", "csstype"),
    path.join(modulesRoot, "csstype"),
    directoryLinkType,
  );

  await writeFile(
    path.join(fixtureRoot, "package.json"),
    `${JSON.stringify({ name: "node-next-consumer", private: true, type: "module" }, null, 2)}\n`,
  );
  await writeFile(
    path.join(fixtureRoot, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          skipLibCheck: false,
          strict: true,
          target: "ES2022",
        },
        include: ["consumer.ts"],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(fixtureRoot, "consumer.ts"),
    [
      'import { validateDossier } from "prospect-dossier-engine";',
      'import type { Dossier, ThemeStyle } from "prospect-dossier-engine";',
      "declare const dossier: Dossier;",
      "declare const theme: ThemeStyle;",
      "export const result = { issues: validateDossier(dossier), theme };",
      "",
    ].join("\n"),
  );

  execFileSync(
    path.join(projectRoot, "node_modules", "typescript", "bin", "tsc"),
    ["-p", path.join(fixtureRoot, "tsconfig.json")],
    { cwd: fixtureRoot, stdio: "pipe" },
  );
  console.log("Package contract: NodeNext consumer resolved public values and types.");
} finally {
  await rm(fixtureRoot, { force: true, recursive: true });
}
