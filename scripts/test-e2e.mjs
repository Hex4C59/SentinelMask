import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const rootDir = resolve(process.cwd());
const args = process.argv.slice(2);
const isHeaded = args.includes("--headed");

function run(command, commandArgs, env = process.env) {
  const result = spawnSync(command, commandArgs, {
    cwd: rootDir,
    stdio: "inherit",
    env,
    shell: false
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function resolveBrowserEnv() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browserEnv = {
    ...process.env,
    PLAYWRIGHT_HEADLESS: isHeaded ? "false" : process.env.PLAYWRIGHT_HEADLESS ?? "true"
  };

  if (!executablePath) {
    return browserEnv;
  }

  return {
    ...browserEnv,
    PLAYWRIGHT_CHROMIUM_EXECUTABLE: executablePath
  };
}

run("npm", ["run", "build"]);

const browserEnv = resolveBrowserEnv();
const playwrightArgs = ["playwright", "test"];
if (isHeaded) {
  playwrightArgs.push("--headed");
}

run("npx", playwrightArgs, browserEnv);
