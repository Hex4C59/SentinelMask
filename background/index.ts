import { LogStore } from "./log-store";
import { getSettings, updateSettings } from "./settings-store";
import { STORAGE_KEYS } from "../shared/constants";
import { RuntimeMessageType } from "../shared/messages";
import type { RuntimeMessage, RuntimeResponse } from "../shared/messages";
import type { GuardLogEntry } from "../shared/types";

let logStore: LogStore | null = null;

async function ensureLogStore(): Promise<LogStore> {
  if (logStore) {
    return logStore;
  }

  const settings = await getSettings();
  const persisted = await chrome.storage.local.get(STORAGE_KEYS.logs);
  const logs = (persisted[STORAGE_KEYS.logs] as GuardLogEntry[] | undefined) ?? [];

  logStore = new LogStore({
    retentionDays: settings.logRetentionDays,
    maxEntries: settings.maxLogEntries,
    maxBytes: settings.maxLogBytes
  });
  logStore.hydrate(logs);

  return logStore;
}

async function persistLogs(store: LogStore): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.logs]: store.list()
  });
}

async function handleMessage(message: RuntimeMessage): Promise<RuntimeResponse<unknown>> {
  switch (message.type) {
    case RuntimeMessageType.GET_SETTINGS: {
      const settings = await getSettings();
      return { ok: true, data: settings };
    }
    case RuntimeMessageType.UPDATE_SETTINGS: {
      const settings = await updateSettings(message.payload);
      const store = await ensureLogStore();
      store.updateConfig({
        retentionDays: settings.logRetentionDays,
        maxEntries: settings.maxLogEntries,
        maxBytes: settings.maxLogBytes
      });
      await persistLogs(store);
      return { ok: true, data: settings };
    }
    case RuntimeMessageType.ADD_LOG: {
      const store = await ensureLogStore();
      store.add(message.payload);
      await persistLogs(store);
      return { ok: true, data: null };
    }
    case RuntimeMessageType.GET_LOGS: {
      const store = await ensureLogStore();
      return { ok: true, data: store.list() };
    }
    case RuntimeMessageType.CLEAR_LOGS: {
      const store = await ensureLogStore();
      store.clear();
      await persistLogs(store);
      return { ok: true, data: [] };
    }
    default:
      return { ok: false, error: "Unsupported message type." };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void getSettings();
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  void handleMessage(message)
    .then((response) => sendResponse(response))
    .catch((error: unknown) => {
      const description = error instanceof Error ? error.message : "Unknown error";
      sendResponse({ ok: false, error: description });
    });
  return true;
});
