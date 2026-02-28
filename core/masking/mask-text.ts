import type { RuleHit, RulePolicyMap, RuleType } from "../../shared/types";

export interface MaskingResult {
  maskedText: string;
  warnings: string[];
}

const placeholderMap: Record<RuleType, string> = {
  name: "[NAME]",
  phone: "[PHONE]",
  bank_card: "[BANK_CARD]",
  email: "[EMAIL]",
  api_key: "[API_KEY]",
  custom: "[CUSTOM]"
};

function maskWithAsterisks(value: string, keepStart: number, keepEnd: number): string {
  if (value.length <= keepStart + keepEnd) {
    return "*".repeat(value.length);
  }
  return `${value.slice(0, keepStart)}${"*".repeat(value.length - keepStart - keepEnd)}${value.slice(
    value.length - keepEnd
  )}`;
}

function replaceDigits(original: string, maskedDigits: string): string {
  let cursor = 0;
  return original.replace(/\d/g, () => {
    const replacement = maskedDigits[cursor] ?? "*";
    cursor += 1;
    return replacement;
  });
}

function partialMaskByRule(hit: RuleHit): string {
  const value = hit.match;

  switch (hit.ruleType) {
    case "phone": {
      const digits = value.replace(/[^\d]/g, "");
      const maskedDigits = maskWithAsterisks(digits, 3, 4);
      return replaceDigits(value, maskedDigits);
    }
    case "bank_card": {
      const digits = value.replace(/[^\d]/g, "");
      const maskedDigits = maskWithAsterisks(digits, 0, 4);
      return replaceDigits(value, maskedDigits);
    }
    case "email": {
      const parts = value.split("@");
      if (parts.length !== 2) {
        return placeholderMap.email;
      }
      const local = parts[0];
      const domain = parts[1];
      const safeLocal = local.length <= 2 ? `${local[0] ?? "*"}*` : maskWithAsterisks(local, 1, 1);
      return `${safeLocal}@${domain}`;
    }
    case "api_key":
      return maskWithAsterisks(value, 4, 4);
    case "name":
      return value.length <= 1 ? "*" : `${value[0]}${"*".repeat(value.length - 1)}`;
    case "custom":
      return maskWithAsterisks(value, 2, 2);
    default:
      return placeholderMap[hit.ruleType];
  }
}

function isOverlapped(hit: RuleHit, blocked: Array<{ start: number; end: number }>): boolean {
  const start = hit.index;
  const end = hit.index + hit.length;
  return blocked.some((range) => !(end <= range.start || start >= range.end));
}

export function applyMasking(
  rawText: string,
  hits: RuleHit[],
  policies: RulePolicyMap
): MaskingResult {
  const warnings: string[] = [];
  const blockedRanges: Array<{ start: number; end: number }> = [];
  let maskedText = rawText;

  const sortedHits = [...hits].sort((a, b) => b.index - a.index || b.length - a.length);

  for (const hit of sortedHits) {
    const policy = policies[hit.ruleType];
    if (!policy || !policy.enabled || policy.maskMode === "warn") {
      continue;
    }

    if (isOverlapped(hit, blockedRanges)) {
      warnings.push(`skip-overlap:${hit.ruleType}`);
      continue;
    }

    const start = hit.index;
    const end = hit.index + hit.length;
    const replacement =
      policy.maskMode === "partial" ? partialMaskByRule(hit) : placeholderMap[hit.ruleType];

    maskedText = `${maskedText.slice(0, start)}${replacement}${maskedText.slice(end)}`;
    blockedRanges.push({ start, end });
  }

  return { maskedText, warnings };
}
