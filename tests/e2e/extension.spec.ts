import { test, expect, resolveExtensionId } from "./fixtures";

test.describe("SentinelMask extension", () => {
  test("masks phone numbers before submit on the simulated DeepSeek host", async ({ page, context }) => {
    page.on("dialog", (dialog) => {
      void dialog.accept();
    });

    const composer = page.locator("#composer");
    const sendButton = page.locator("#send-button");
    const sentOutput = page.locator("#sent-output");

    await composer.click();
    await composer.fill("我的手机号是 15783248743，怎么注册谷歌账户");
    await sendButton.click();

    await expect(sentOutput).toContainText("157****8743");
    await expect(sentOutput).not.toContainText("15783248743");

    const extensionId = await resolveExtensionId(context);
    const optionsPage = await context.newPage();

    try {
      await optionsPage.goto(`chrome-extension://${extensionId}/options/index.html`, {
        waitUntil: "domcontentloaded"
      });
      await expect(optionsPage.locator("#log-output")).toContainText("chat.deepseek.com");
      await expect(optionsPage.locator("#log-output")).toContainText("phone");
      await expect(optionsPage.locator("#log-output")).toContainText("allow");
    } finally {
      await optionsPage.close();
    }
  });
});
