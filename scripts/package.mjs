import { createWriteStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import archiver from "archiver";
import { build } from "esbuild";
import { copyStaticFiles, createBuildConfig } from "./build-shared.mjs";

const rootDir = resolve(process.cwd());
const distDir = resolve(rootDir, "dist");
const artifactsDir = resolve(rootDir, "artifacts");

async function runBuild() {
  await build(createBuildConfig());
  copyStaticFiles();
}

function getZipOutputPath() {
  const pkgJsonPath = resolve(rootDir, "package.json");
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
  const version = pkgJson.version ?? "0.0.0";
  const zipFileName = `sentinelmask-v${version}.zip`;
  return resolve(artifactsDir, zipFileName);
}

function zipDist(zipPath) {
  if (!existsSync(distDir)) {
    throw new Error("dist directory does not exist. Build step may have failed.");
  }

  mkdirSync(artifactsDir, { recursive: true });

  return new Promise((resolvePromise, rejectPromise) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      resolvePromise(archive.pointer());
    });

    archive.on("warning", (warning) => {
      if (warning.code === "ENOENT") {
        process.stderr.write(`zip warning: ${warning.message}\n`);
        return;
      }
      rejectPromise(warning);
    });

    archive.on("error", (error) => {
      rejectPromise(error);
    });

    archive.pipe(output);
    archive.directory(distDir, false);
    void archive.finalize();
  });
}

async function main() {
  await runBuild();
  const zipPath = getZipOutputPath();
  const bytes = await zipDist(zipPath);
  const kb = (Number(bytes) / 1024).toFixed(1);
  process.stdout.write(`Created extension package: ${zipPath} (${kb} KB)\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`package failed: ${message}\n`);
  process.exit(1);
});
