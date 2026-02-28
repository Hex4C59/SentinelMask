import { describe, expect, it } from "vitest";
import { detectBuiltinHits } from "../../core/rules/builtin-rules";

describe("detectBuiltinHits", () => {
  it("detects phone, email, bank card and api key", () => {
    const text =
      "手机号 13800138000 邮箱 test@example.com 卡号 4532 0151 1283 0366 key sk-proj-abcdefghijklmnopqrstuvwxyz";
    const hits = detectBuiltinHits(text, {
      name: true,
      phone: true,
      bank_card: true,
      email: true,
      api_key: true
    });

    const types = hits.map((item) => item.ruleType);
    expect(types).toContain("phone");
    expect(types).toContain("email");
    expect(types).toContain("bank_card");
    expect(types).toContain("api_key");
  });

  it("respects disabled rules", () => {
    const text = "我的手机号是 13800138000";
    const hits = detectBuiltinHits(text, {
      name: true,
      phone: false,
      bank_card: true,
      email: true,
      api_key: true
    });
    expect(hits.some((hit) => hit.ruleType === "phone")).toBe(false);
  });
});
