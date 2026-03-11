import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test as base, chromium, expect, type BrowserContext, type Page } from "@playwright/test";

const workspaceRoot = path.resolve(__dirname, "../..");
const extensionPath = path.resolve(workspaceRoot, "dist");
const userDataDirPrefix = path.join(tmpdir(), "sentinelmask-e2e-");
const browserExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const shouldRunHeadless = process.env.PLAYWRIGHT_HEADLESS !== "false";
const extensionHost = "chat.deepseek.com";
const extensionOrigin = `https://${extensionHost}`;

interface ExtensionFixtures {
  context: BrowserContext;
  page: Page;
}

export async function resolveExtensionId(context: BrowserContext): Promise<string> {
  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  return new URL(serviceWorker.url()).host;
}

function buildDeepSeekHostHtml(): string {
  return `
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>SentinelMask DeepSeek E2E Host</title>
        <style>
          :root {
            color-scheme: dark;
          }
          body {
            font-family: system-ui, sans-serif;
            margin: 0;
            min-height: 100vh;
            background: linear-gradient(180deg, #0f172a 0%, #020617 100%);
            color: #e2e8f0;
          }
          main {
            width: min(960px, calc(100vw - 48px));
            margin: 48px auto;
          }
          .deepseek-shell {
            display: grid;
            gap: 16px;
          }
          .input-shell {
            display: grid;
            gap: 12px;
            padding: 20px;
            border: 1px solid #334155;
            border-radius: 20px;
            background: rgba(15, 23, 42, 0.88);
            box-shadow: 0 20px 60px rgba(15, 23, 42, 0.35);
          }
          .editor-stack {
            display: grid;
            gap: 8px;
          }
          [contenteditable] {
            min-height: 120px;
            padding: 16px;
            border: 1px solid #334155;
            border-radius: 16px;
            background: #111827;
            white-space: pre-wrap;
            outline: none;
          }
          .actions {
            display: flex;
            justify-content: flex-end;
          }
          button {
            width: fit-content;
            padding: 10px 16px;
            border: 0;
            border-radius: 999px;
            background: #2563eb;
            color: white;
            cursor: pointer;
          }
          #sent-output {
            padding: 16px;
            border-radius: 16px;
            background: #111827;
            border: 1px solid #334155;
            min-height: 80px;
          }
        </style>
      </head>
      <body>
        <main>
          <div class="deepseek-shell">
            <h1>SentinelMask DeepSeek E2E Host</h1>
            <div class="input-shell" data-testid="deepseek-input-shell">
              <div class="editor-stack">
                <label for="composer">消息输入框</label>
                <div
                  id="composer"
                  class="composer"
                  contenteditable="plaintext-only"
                  aria-label="消息输入框"
                ></div>
              </div>
              <div class="actions">
                <button
                  id="send-button"
                  type="button"
                  data-testid="deepseek-send-button"
                  aria-label="发送消息"
                >
                  发送
                </button>
              </div>
            </div>
            <section>
              <h2>Sent output</h2>
              <div id="sent-output"></div>
            </section>
          </div>
        </main>
        <script>
          const composer = document.getElementById("composer");
          const sendButton = document.getElementById("send-button");
          const sentOutput = document.getElementById("sent-output");

          sendButton.addEventListener("mousedown", () => {
            composer.blur();
          });

          sendButton.addEventListener("click", () => {
            sentOutput.textContent = composer.textContent || "";
            window.lastSubmittedText = sentOutput.textContent;
          });
        </script>
      </body>
    </html>
  `;
}

export const test = base.extend<ExtensionFixtures>({
  context: async ({}, use) => {
    const userDataDir = mkdtempSync(userDataDirPrefix);
    const launchOptions = {
      headless: shouldRunHeadless,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        `--host-resolver-rules=MAP ${extensionHost} 127.0.0.1`
      ]
    };

    const context = browserExecutablePath
      ? await chromium.launchPersistentContext(userDataDir, {
          ...launchOptions,
          executablePath: browserExecutablePath
        })
      : await chromium.launchPersistentContext(userDataDir, {
          ...launchOptions,
          channel: "chromium"
        });

    await resolveExtensionId(context);

    try {
      await use(context);
    } finally {
      await context.close();
      rmSync(userDataDir, { recursive: true, force: true });
    }
  },

  page: async ({ context }, use) => {
    const page = await context.newPage();
    await page.route(`${extensionOrigin}/**`, async (route) => {
      const requestUrl = route.request().url();
      const url = new URL(requestUrl);

      if (url.pathname === "/" || url.pathname === "/index.html") {
        await route.fulfill({
          contentType: "text/html; charset=utf-8",
          body: buildDeepSeekHostHtml()
        });
        return;
      }

      await route.continue();
    });

    await page.goto(`${extensionOrigin}/`, { waitUntil: "domcontentloaded" });

    try {
      await use(page);
    } finally {
      await page.close();
    }
  }
});

export { expect };
