import type { GuardSettings, RulePolicyMap } from "./types";

export const SITE_ALLOWLIST = [
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "gemini.google.com",
  "chat.deepseek.com"
] as const;

const defaultPolicies: RulePolicyMap = {
  name: { enabled: true, maskMode: "warn", riskLevel: "low" },
  phone: { enabled: true, maskMode: "partial", riskLevel: "medium" },
  bank_card: { enabled: true, maskMode: "full", riskLevel: "high" },
  email: { enabled: true, maskMode: "partial", riskLevel: "medium" },
  api_key: { enabled: true, maskMode: "full", riskLevel: "high" },
  custom: { enabled: true, maskMode: "full", riskLevel: "medium" }
};

export const DEFAULT_SETTINGS: GuardSettings = {
  enabled: true,
  rulePolicies: defaultPolicies,
  allowSites: [...SITE_ALLOWLIST],
  logRetentionDays: 30,
  maxLogEntries: 5000,
  maxLogBytes: 5 * 1024 * 1024
};

export const STORAGE_KEYS = {
  settings: "sentinelMask.settings.v1",
  logs: "sentinelMask.logs.v1"
} as const;
