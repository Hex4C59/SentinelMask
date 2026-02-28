import type { GuardErrorCode } from "./errors";

export type SendTrigger =
  | "enter"
  | "ctrl_enter"
  | "button_click"
  | "submit"
  | "programmatic"
  | "unknown";

export type InputKind = "textarea" | "contenteditable";
export type RuleType = "name" | "phone" | "bank_card" | "email" | "api_key" | "custom";
export type RuleSource = "builtin" | "custom";
export type MaskMode = "full" | "partial" | "warn";
export type RiskLevel = "low" | "medium" | "high";
export type GuardAction = "allow" | "confirm" | "block";

export interface PreSendContext {
  site: string;
  trigger: SendTrigger;
  isComposing: boolean;
  rawText: string;
  inputKind: InputKind;
}

export interface RuleHit {
  ruleType: RuleType;
  source: RuleSource;
  riskLevel: RiskLevel;
  defaultMaskMode: MaskMode;
  match: string;
  index: number;
  length: number;
}

export interface GuardHitSummary {
  ruleType: RuleType;
  source: RuleSource;
  riskLevel: RiskLevel;
}

export interface GuardResult {
  maskedText: string;
  riskLevel: RiskLevel;
  action: GuardAction;
  hits: GuardHitSummary[];
  warnings: string[];
  reasonCode: GuardErrorCode;
}

export interface RulePolicy {
  enabled: boolean;
  maskMode: MaskMode;
  riskLevel: RiskLevel;
}

export type RulePolicyMap = Record<RuleType, RulePolicy>;

export interface GuardSettings {
  enabled: boolean;
  rulePolicies: RulePolicyMap;
  allowSites: string[];
  logRetentionDays: number;
  maxLogEntries: number;
  maxLogBytes: number;
}

export interface GuardLogEntry {
  id: string;
  timestamp: number;
  site: string;
  trigger: SendTrigger;
  action: GuardAction;
  riskLevel: RiskLevel;
  hitTypes: RuleType[];
  hitCount: number;
  sources: RuleSource[];
  warnings: string[];
  errorCode?: GuardErrorCode;
}
