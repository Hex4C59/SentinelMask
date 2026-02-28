import { describe, expect, it } from "vitest";
import { preSendGuard } from "../../core/guard/pre-send-guard";
import { DEFAULT_SETTINGS } from "../../shared/constants";

describe("preSendGuard", () => {
  it("returns allow when no hit", () => {
    const result = preSendGuard(
      {
        site: "chatgpt.com",
        trigger: "enter",
        isComposing: false,
        rawText: "hello world",
        inputKind: "textarea"
      },
      DEFAULT_SETTINGS.rulePolicies
    );

    expect(result.action).toBe("allow");
    expect(result.hits.length).toBe(0);
  });

  it("returns block for high risk api key", () => {
    const result = preSendGuard(
      {
        site: "chatgpt.com",
        trigger: "enter",
        isComposing: false,
        rawText: "token sk-proj-abcdefghijklmnopqrstuvwxyz",
        inputKind: "textarea"
      },
      DEFAULT_SETTINGS.rulePolicies
    );

    expect(result.action).toBe("block");
    expect(result.riskLevel).toBe("high");
    expect(result.maskedText).not.toContain("sk-proj-abcdefghijklmnopqrstuvwxyz");
  });

  it("skips detection while composing", () => {
    const result = preSendGuard(
      {
        site: "chatgpt.com",
        trigger: "enter",
        isComposing: true,
        rawText: "13800138000",
        inputKind: "textarea"
      },
      DEFAULT_SETTINGS.rulePolicies
    );

    expect(result.action).toBe("allow");
    expect(result.hits.length).toBe(0);
    expect(result.warnings).toContain("ime-composing");
  });
});
