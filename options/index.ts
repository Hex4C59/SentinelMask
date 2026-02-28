import { DEFAULT_SETTINGS } from "../shared/constants";
import type { GuardSettings, RuleType } from "../shared/types";
import {
  clearGuardLogs,
  getGuardLogs,
  getGuardSettings,
  putGuardSettings
} from "../content/runtime-client";

const orderedRuleTypes: RuleType[] = ["name", "phone", "bank_card", "email", "api_key", "custom"];
let currentSettings: GuardSettings = DEFAULT_SETTINGS;

function setStatus(text: string, isError = false): void {
  const status = document.getElementById("status");
  if (!status) {
    return;
  }
  status.textContent = text;
  status.style.color = isError ? "#b42318" : "#0b8f41";
}

function buildRuleRow(ruleType: RuleType): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "rule-item";

  const label = document.createElement("strong");
  label.textContent = ruleType;

  const enabled = document.createElement("input");
  enabled.type = "checkbox";
  enabled.dataset.ruleType = ruleType;
  enabled.dataset.field = "enabled";
  enabled.checked = currentSettings.rulePolicies[ruleType].enabled;

  const maskMode = document.createElement("select");
  maskMode.dataset.ruleType = ruleType;
  maskMode.dataset.field = "maskMode";
  for (const option of ["full", "partial", "warn"] as const) {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option;
    maskMode.appendChild(item);
  }
  maskMode.value = currentSettings.rulePolicies[ruleType].maskMode;

  const riskLevel = document.createElement("select");
  riskLevel.dataset.ruleType = ruleType;
  riskLevel.dataset.field = "riskLevel";
  for (const option of ["low", "medium", "high"] as const) {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option;
    riskLevel.appendChild(item);
  }
  riskLevel.value = currentSettings.rulePolicies[ruleType].riskLevel;

  row.appendChild(label);
  row.appendChild(enabled);
  row.appendChild(maskMode);
  row.appendChild(riskLevel);
  return row;
}

function renderRules(): void {
  const root = document.getElementById("rule-settings");
  if (!root) {
    return;
  }
  root.innerHTML = "";
  for (const ruleType of orderedRuleTypes) {
    root.appendChild(buildRuleRow(ruleType));
  }
}

function readFormAsPatch(): Partial<GuardSettings> {
  const policies = { ...currentSettings.rulePolicies };
  const controls = document.querySelectorAll<HTMLElement>("[data-rule-type][data-field]");
  controls.forEach((element) => {
    const ruleType = element.dataset.ruleType as RuleType;
    const field = element.dataset.field;
    if (!ruleType || !field) {
      return;
    }

    if (field === "enabled" && element instanceof HTMLInputElement) {
      policies[ruleType].enabled = element.checked;
    }
    if (field === "maskMode" && element instanceof HTMLSelectElement) {
      policies[ruleType].maskMode = element.value as GuardSettings["rulePolicies"][RuleType]["maskMode"];
    }
    if (field === "riskLevel" && element instanceof HTMLSelectElement) {
      policies[ruleType].riskLevel =
        element.value as GuardSettings["rulePolicies"][RuleType]["riskLevel"];
    }
  });

  return { rulePolicies: policies };
}

async function refreshLogs(): Promise<void> {
  const output = document.getElementById("log-output");
  if (!output) {
    return;
  }
  const logs = await getGuardLogs();
  output.textContent = JSON.stringify(logs.slice(0, 100), null, 2);
}

async function saveSettings(): Promise<void> {
  setStatus("正在保存...");
  const patch = readFormAsPatch();
  currentSettings = await putGuardSettings(patch);
  setStatus("设置已保存。");
}

async function wireActions(): Promise<void> {
  const saveButton = document.getElementById("save-settings");
  const refreshButton = document.getElementById("refresh-logs");
  const clearButton = document.getElementById("clear-logs");

  saveButton?.addEventListener("click", () => {
    void saveSettings().catch((error: unknown) => {
      const msg = error instanceof Error ? error.message : "保存失败";
      setStatus(msg, true);
    });
  });

  refreshButton?.addEventListener("click", () => {
    void refreshLogs().catch((error: unknown) => {
      const msg = error instanceof Error ? error.message : "刷新失败";
      setStatus(msg, true);
    });
  });

  clearButton?.addEventListener("click", () => {
    void clearGuardLogs()
      .then(() => refreshLogs())
      .then(() => setStatus("日志已清空。"))
      .catch((error: unknown) => {
        const msg = error instanceof Error ? error.message : "清空失败";
        setStatus(msg, true);
      });
  });
}

async function bootstrap(): Promise<void> {
  currentSettings = await getGuardSettings();
  renderRules();
  await wireActions();
  await refreshLogs();
  setStatus("配置已加载。");
}

void bootstrap().catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : "初始化失败";
  setStatus(msg, true);
});
