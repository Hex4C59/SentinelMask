import { mkdirSync, cpSync } from "node:fs";
import { dirname, resolve } from "node:path";

const rootDir = resolve(process.cwd());

export const outDir = resolve(rootDir, "dist");

const staticFiles = [
  { from: "manifest.json", to: "manifest.json" },
  { from: "options/index.html", to: "options/index.html" },
  { from: "options/styles.css", to: "options/styles.css" }
];

export function copyStaticFiles() {
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
