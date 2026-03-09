import { mkdirSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const rootDir = resolve(process.cwd());

export const outDir = resolve(rootDir, "dist");

const staticFiles = [
  { from: "options/index.html", to: "options/index.html" },
  { from: "options/styles.css", to: "options/styles.css" }
];

function readJsonFile(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function getPackageVersion() {
  const version = readJsonFile(resolve(rootDir, "package.json")).version;

  if (typeof version !== "string" || !/^\d+(\.\d+){0,3}$/.test(version)) {
    throw new Error(
      `Invalid extension version "${String(version)}". Use up to four numeric segments, for example 0.2.0.`
    );
  }

  return version;
}

function copyManifestFile() {
  const manifest = readJsonFile(resolve(rootDir, "manifest.json"));
  manifest.version = getPackageVersion();

  const targetPath = resolve(outDir, "manifest.json");
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

export function copyStaticFiles() {
  copyManifestFile();

  for (const item of staticFiles) {
    const from = resolve(rootDir, item.from);
    const to = resolve(outDir, item.to);
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to);
  }
}

export function createBuildConfig({ watch = false } = {}) {
  return {
    entryPoints: {
      "content/index": resolve(rootDir, "content/index.ts"),
      "background/index": resolve(rootDir, "background/index.ts"),
      "options/index": resolve(rootDir, "options/index.ts")
    },
    outdir: outDir,
    format: "iife",
    bundle: true,
    sourcemap: watch,
    minify: false,
    platform: "browser",
    target: ["chrome114", "edge114", "firefox115"],
    logLevel: "info"
  };
}
