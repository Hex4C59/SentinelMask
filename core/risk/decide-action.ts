import type { GuardAction, PreSendContext, RiskLevel, RuleHit, RuleType } from "../../shared/types";

const riskRank: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3
};

function maxRisk(left: RiskLevel, right: RiskLevel): RiskLevel {
  return riskRank[left] >= riskRank[right] ? left : right;
}

function enforceMinimumRisk(ruleType: RuleType, riskLevel: RiskLevel): RiskLevel {
  if ((ruleType === "bank_card" || ruleType === "api_key") && riskLevel === "low") {
    return "medium";
  }
  return riskLevel;
}

function actionFromRisk(riskLevel: RiskLevel): GuardAction {
  if (riskLevel === "high") {
    return "block";
  }
  if (riskLevel === "medium") {
    return "confirm";
  }
  return "allow";
}

export interface RiskDecision {
  riskLevel: RiskLevel;
  action: GuardAction;
  warnings: string[];
}

export function decideAction(context: PreSendContext, hits: RuleHit[]): RiskDecision {
  const warnings: string[] = [];

  if (hits.length === 0) {
    if (context.trigger === "unknown") {
      warnings.push("unknown-trigger");
      return { riskLevel: "medium", action: "confirm", warnings };
    }
    return { riskLevel: "low", action: "allow", warnings };
  }

  let riskLevel: RiskLevel = "low";
  for (const hit of hits) {
    const nextRisk = enforceMinimumRisk(hit.ruleType, hit.riskLevel);
    if (nextRisk !== hit.riskLevel) {
      warnings.push(`risk-floor:${hit.ruleType}`);
    }
    riskLevel = maxRisk(riskLevel, nextRisk);
  }

  if (context.trigger === "unknown" && riskLevel === "low") {
    riskLevel = "medium";
    warnings.push("unknown-trigger");
  }

  return { riskLevel, action: actionFromRisk(riskLevel), warnings };
}
