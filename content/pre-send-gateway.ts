import { preSendGuard } from "../core/guard/pre-send-guard";
import {
  readTextFromElement,
  resolveInputKind,
  type EditableElement
} from "../core/text/input-accessor";
import { GuardErrorCode } from "../shared/errors";
import type { GuardAction, GuardLogEntry, SendTrigger } from "../shared/types";
import { addGuardLog, getGuardSettings } from "./runtime-client";
import { confirmRiskAction } from "./ui/confirm";

interface GatewayIntent {
  trigger: SendTrigger;
  editable: EditableElement;
  site: string;
  isComposing: boolean;
  replaySend: () => void;
}

function createLogEntry(
  site: string,
  trigger: SendTrigger,
  guardAction: GuardAction,
  result: ReturnType<typeof preSendGuard>
): GuardLogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    site,
    trigger,
    action: guardAction,
    riskLevel: result.riskLevel,
    hitTypes: result.hits.map((hit) => hit.ruleType),
    hitCount: result.hits.length,
    sources: [...new Set(result.hits.map((hit) => hit.source))],
    warnings: result.warnings,
    errorCode: result.reasonCode
  };
}

export async function runGateway(intent: GatewayIntent): Promise<void> {
  const settings = await getGuardSettings();
  if (!settings.enabled) {
    intent.replaySend();
    return;
  }

  const rawText = readTextFromElement(intent.editable);
  const context = {
    site: intent.site,
    trigger: intent.trigger,
    isComposing: intent.isComposing,
    rawText,
    inputKind: resolveInputKind(intent.editable)
  };

  const result = preSendGuard(context, settings.rulePolicies);
  let action: GuardAction = result.action;

  if (result.maskedText !== rawText) {
    if ("value" in intent.editable) {
      intent.editable.value = result.maskedText;
      intent.editable.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      intent.editable.textContent = result.maskedText;
      intent.editable.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  const confirmed = confirmRiskAction(result);
  if (confirmed) {
    action = "allow";
    intent.replaySend();
  } else if (result.action === "confirm") {
    action = "block";
  }

  await addGuardLog(createLogEntry(intent.site, intent.trigger, action, result));
}

export async function runGatewayWithFailSafe(intent: GatewayIntent): Promise<void> {
  try {
    await runGateway(intent);
  } catch (error) {
    const message = error instanceof Error ? error.message : "runtime-error";
    const fallbackEntry: GuardLogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      site: intent.site,
      trigger: intent.trigger,
      action: "confirm",
      riskLevel: "medium",
      hitTypes: [],
      hitCount: 0,
      sources: [],
      warnings: [`gateway-fallback:${message}`],
      errorCode: GuardErrorCode.ENGINE_RUNTIME_ERROR
    };
    await addGuardLog(fallbackEntry);
    const allow = window.confirm(
      "SentinelMask 本次未完成完整检测，是否继续发送原文？\n建议：先检查是否包含敏感信息。"
    );
    if (allow) {
      intent.replaySend();
    }
  }
}
