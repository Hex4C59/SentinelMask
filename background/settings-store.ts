import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../shared/constants";
import type { GuardSettings, RulePolicyMap } from "../shared/types";

function mergeRulePolicies(policies?: Partial<RulePolicyMap>): RulePolicyMap {
  return {
    name: { ...DEFAULT_SETTINGS.rulePolicies.name, ...(policies?.name ?? {}) },
    phone: { ...DEFAULT_SETTINGS.rulePolicies.phone, ...(policies?.phone ?? {}) },
    bank_card: { ...DEFAULT_SETTINGS.rulePolicies.bank_card, ...(policies?.bank_card ?? {}) },
    email: { ...DEFAULT_SETTINGS.rulePolicies.email, ...(policies?.email ?? {}) },
    api_key: { ...DEFAULT_SETTINGS.rulePolicies.api_key, ...(policies?.api_key ?? {}) },
    custom: { ...DEFAULT_SETTINGS.rulePolicies.custom, ...(policies?.custom ?? {}) }
  };
}

function normalizeSettings(value?: Partial<GuardSettings>): GuardSettings {
  return {
    enabled: value?.enabled ?? DEFAULT_SETTINGS.enabled,
    rulePolicies: mergeRulePolicies(value?.rulePolicies),
    allowSites: value?.allowSites ?? [...DEFAULT_SETTINGS.allowSites],
    logRetentionDays: value?.logRetentionDays ?? DEFAULT_SETTINGS.logRetentionDays,
    maxLogEntries: value?.maxLogEntries ?? DEFAULT_SETTINGS.maxLogEntries,
    maxLogBytes: value?.maxLogBytes ?? DEFAULT_SETTINGS.maxLogBytes
  };
}

export async function getSettings(): Promise<GuardSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
  const raw = result[STORAGE_KEYS.settings] as Partial<GuardSettings> | undefined;
  const settings = normalizeSettings(raw);
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings });
  return settings;
}

export async function updateSettings(patch: Partial<GuardSettings>): Promise<GuardSettings> {
  const current = await getSettings();
  const merged = normalizeSettings({
    ...current,
    ...patch,
    rulePolicies: {
      ...current.rulePolicies,
      ...(patch.rulePolicies ?? {})
    }
  });
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: merged });
  return merged;
}
