import { build } from "esbuild";
import { copyStaticFiles, createBuildConfig } from "./build-shared.mjs";

async function runBuild() {
  await build(createBuildConfig());
  copyStaticFiles();
}

runBuild().catch((error) => {
  console.error(error);
  process.exit(1);
});
