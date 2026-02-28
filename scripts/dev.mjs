import { context } from "esbuild";
import { copyStaticFiles, createBuildConfig } from "./build-shared.mjs";

async function runDev() {
  const ctx = await context(createBuildConfig({ watch: true }));
  await ctx.watch();
  copyStaticFiles();
  process.stdout.write("SentinelMask dev watch started. Dist files are rebuilt on change.\n");
}

runDev().catch((error) => {
  console.error(error);
  process.exit(1);
});
