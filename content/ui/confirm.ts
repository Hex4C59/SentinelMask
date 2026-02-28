import type { GuardResult } from "../../shared/types";

function hitSummary(result: GuardResult): string {
  const counts = new Map<string, number>();
  for (const hit of result.hits) {
    const current = counts.get(hit.ruleType) ?? 0;
    counts.set(hit.ruleType, current + 1);
  }

  return [...counts.entries()]
    .map(([ruleType, count]) => `${ruleType}:${count}`)
    .join(", ");
}

export function confirmRiskAction(result: GuardResult): boolean {
  if (result.action === "allow") {
    return true;
  }

  const prefix = result.action === "block" ? "检测到高风险敏感信息。" : "检测到中风险敏感信息。";
  const message = `${prefix}\n命中: ${hitSummary(result)}\n是否继续发送脱敏后的文本？`;
  return window.confirm(message);
}
