import { describe, expect, it } from "vitest";
import { applyMasking } from "../../core/masking/mask-text";
import { DEFAULT_SETTINGS } from "../../shared/constants";
import type { RuleHit } from "../../shared/types";

describe("applyMasking", () => {
  it("applies partial masking for phone", () => {
    const raw = "手机号 13800138000";
    const hits: RuleHit[] = [
      {
        ruleType: "phone",
        source: "builtin",
        riskLevel: "medium",
        defaultMaskMode: "partial",
        match: "13800138000",
        index: 4,
        length: 11
      }
    ];

    const result = applyMasking(raw, hits, DEFAULT_SETTINGS.rulePolicies);
    expect(result.maskedText).toContain("138****8000");
  });

  it("keeps text unchanged when mode is warn", () => {
    const raw = "姓名: 张三";
    const hits: RuleHit[] = [
      {
        ruleType: "name",
        source: "builtin",
        riskLevel: "low",
        defaultMaskMode: "warn",
        match: "张三",
        index: 4,
        length: 2
      }
    ];

    const result = applyMasking(raw, hits, DEFAULT_SETTINGS.rulePolicies);
    expect(result.maskedText).toBe(raw);
  });
});
