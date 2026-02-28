import { GuardErrorCode } from "../../shared/errors";
import type { GuardResult, PreSendContext, RuleHit, RulePolicyMap } from "../../shared/types";
import { applyMasking } from "../masking/mask-text";
import { decideAction } from "../risk/decide-action";
import { detectBuiltinHits } from "../rules/builtin-rules";

function applyPolicyToHits(hits: RuleHit[], policies: RulePolicyMap): RuleHit[] {
  return hits
    .filter((hit) => policies[hit.ruleType]?.enabled !== false)
    .map((hit) => {
      const policy = policies[hit.ruleType];
      if (!policy) {
        return hit;
      }
      return {
        ...hit,
        riskLevel: policy.riskLevel,
        defaultMaskMode: policy.maskMode
      };
    });
}

export function preSendGuard(context: PreSendContext, policies: RulePolicyMap): GuardResult {
  if (context.isComposing) {
    return {
      maskedText: context.rawText,
      riskLevel: "low",
      action: "allow",
      hits: [],
      warnings: ["ime-composing"],
      reasonCode: GuardErrorCode.IME_COMPOSING
    };
  }

  try {
    const enabledBuiltin = {
      name: policies.name.enabled,
      phone: policies.phone.enabled,
      bank_card: policies.bank_card.enabled,
      email: policies.email.enabled,
      api_key: policies.api_key.enabled
    };
    const builtinHits = detectBuiltinHits(context.rawText, enabledBuiltin);
    const hits = applyPolicyToHits(builtinHits, policies);
    const masking = applyMasking(context.rawText, hits, policies);
    const decision = decideAction(context, hits);

    return {
      maskedText: masking.maskedText,
      riskLevel: decision.riskLevel,
      action: decision.action,
      hits: hits.map((hit) => ({
        ruleType: hit.ruleType,
        source: hit.source,
        riskLevel: hit.riskLevel
      })),
      warnings: [...masking.warnings, ...decision.warnings],
      reasonCode:
        context.trigger === "unknown" ? GuardErrorCode.UNKNOWN_SEND_TRIGGER : GuardErrorCode.NONE
    };
  } catch (error) {
    const details = error instanceof Error ? error.message : "unknown";
    return {
      maskedText: context.rawText,
      riskLevel: "medium",
      action: "confirm",
      hits: [],
      warnings: [`guard-error:${details}`],
      reasonCode: GuardErrorCode.ENGINE_RUNTIME_ERROR
    };
  }
}
