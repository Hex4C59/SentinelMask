import { describe, expect, it } from "vitest";
import { isValidLuhn } from "../../core/rules/luhn";

describe("isValidLuhn", () => {
  it("accepts valid card number", () => {
    expect(isValidLuhn("4532015112830366")).toBe(true);
  });

  it("rejects invalid card number", () => {
    expect(isValidLuhn("4532015112830367")).toBe(false);
  });

  it("rejects non-digit text", () => {
    expect(isValidLuhn("abcd1234")).toBe(false);
  });
});
