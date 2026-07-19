import { mkdir, mkdtemp, rename, rm, stat } from "node:fs/promises";
import { join } from "node:path";

const STAGING_PREFIX = ".render-";
const BACKUP_PREFIX = ".render-backup-";
const PUBLISH_LOCK = ".render-publish.lock";
const LOCK_RETRY_MS = 25;
const LOCK_TIMEOUT_MS = 30_000;
const STALE_LOCK_MS = 5 * 60_000;

export interface RenderWorkspace {
  readonly outputPath: string;
  readonly stagingPath: string;
  readonly slidesPath: string;
  readonly contactSheetPath: string;
  readonly pdfPath: string;
  readonly reportPath: string;
  readonly reportChecksumPath: string;
}

interface ArtifactMove {
  readonly source: string;
  readonly destination: string;
  readonly name: string;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function hasCode(error: unknown, code: string): boolean {
  return error instanceof Error && "code" in error && error.code === code;
}

async function acquirePublishLock(outputPath: string): Promise<string> {
  const lockPath = join(outputPath, PUBLISH_LOCK);
  const startedAt = Date.now();
  while (true) {
    try {
      await mkdir(lockPath);
      return lockPath;
    } catch (error) {
      if (!hasCode(error, "EEXIST")) throw error;
      const lockStat = await stat(lockPath).catch(() => undefined);
      if (lockStat !== undefined && Date.now() - lockStat.mtimeMs > STALE_LOCK_MS) {
        await rm(lockPath, { force: true, recursive: true });
        continue;
      }
      if (Date.now() - startedAt >= LOCK_TIMEOUT_MS) {
        throw new Error(`Publication concurrente toujours active après ${LOCK_TIMEOUT_MS} ms.`);
      }
      await delay(LOCK_RETRY_MS);
    }
  }
}

function artifactMoves(workspace: RenderWorkspace): readonly ArtifactMove[] {
  return [
    { source: workspace.slidesPath, destination: join(workspace.outputPath, "slides"), name: "slides" },
    {
      source: workspace.contactSheetPath,
      destination: join(workspace.outputPath, "contact-sheet.png"),
      name: "contact-sheet.png",
    },
    { source: workspace.pdfPath, destination: join(workspace.outputPath, "dossier.pdf"), name: "dossier.pdf" },
    {
      source: workspace.reportPath,
      destination: join(workspace.outputPath, "render-report.json"),
      name: "render-report.json",
    },
    {
      source: workspace.reportChecksumPath,
      destination: join(workspace.outputPath, "render-report.sha256"),
      name: "render-report.sha256",
    },
  ];
}

export async function prepareRenderWorkspace(outputPath: string): Promise<RenderWorkspace> {
  await mkdir(outputPath, { recursive: true });
  const stagingPath = await mkdtemp(join(outputPath, STAGING_PREFIX));
  const slidesPath = join(stagingPath, "slides");
  await mkdir(slidesPath, { recursive: true });
  return {
    outputPath,
    stagingPath,
    slidesPath,
    contactSheetPath: join(stagingPath, "contact-sheet.png"),
    pdfPath: join(stagingPath, "dossier.pdf"),
    reportPath: join(stagingPath, "render-report.json"),
    reportChecksumPath: join(stagingPath, "render-report.sha256"),
  };
}

async function assertCompleteWorkspace(workspace: RenderWorkspace): Promise<void> {
  for (const move of artifactMoves(workspace)) {
    const artifactStat = await stat(move.source).catch(() => undefined);
    if (artifactStat === undefined) throw new Error(`Artefact de rendu absent: ${move.source}`);
    if (move.name === "slides" ? !artifactStat.isDirectory() : !artifactStat.isFile()) {
      throw new Error(`Type d'artefact de rendu invalide: ${move.source}`);
    }
  }
}

async function rollback(
  promoted: readonly ArtifactMove[],
  backedUp: readonly ArtifactMove[],
  backupPath: string,
): Promise<void> {
  for (const move of [...promoted].reverse()) {
    await rm(move.destination, { force: true, recursive: true });
  }
  for (const move of [...backedUp].reverse()) {
    await rename(join(backupPath, move.name), move.destination);
  }
}

export async function publishRenderWorkspace(workspace: RenderWorkspace): Promise<void> {
  await assertCompleteWorkspace(workspace);
  const lockPath = await acquirePublishLock(workspace.outputPath);
  try {
    const backupPath = await mkdtemp(join(workspace.outputPath, BACKUP_PREFIX));
    const moves = artifactMoves(workspace);
    const backedUp: ArtifactMove[] = [];
    const promoted: ArtifactMove[] = [];
    try {
      for (const move of moves) {
        const destinationStat = await stat(move.destination).catch(() => undefined);
        if (destinationStat !== undefined) {
          await rename(move.destination, join(backupPath, move.name));
          backedUp.push(move);
        }
      }
      for (const move of moves) {
        await rename(move.source, move.destination);
        promoted.push(move);
      }
    } catch (error) {
      try {
        await rollback(promoted, backedUp, backupPath);
      } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], "Publication et restauration du rendu échouées.");
      }
      throw error;
    } finally {
      await rm(backupPath, { force: true, recursive: true }).catch(() => undefined);
    }
  } finally {
    await rm(lockPath, { force: true, recursive: true }).catch(() => undefined);
  }
}

export async function cleanupRenderWorkspace(workspace: RenderWorkspace): Promise<void> {
  await rm(workspace.stagingPath, { force: true, recursive: true });
}
