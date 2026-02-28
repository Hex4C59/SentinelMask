import { RuntimeMessageType } from "../shared/messages";
import type { RuntimeMessage, RuntimeResponse } from "../shared/messages";
import type { GuardLogEntry, GuardSettings } from "../shared/types";

function sendMessage<T>(message: RuntimeMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response?: RuntimeResponse<T>) => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }
      if (!response) {
        reject(new Error("Empty runtime response."));
        return;
      }
      if (!response.ok) {
        reject(new Error(response.error));
        return;
      }
      resolve(response.data);
    });
  });
}

export function getGuardSettings(): Promise<GuardSettings> {
  return sendMessage<GuardSettings>({ type: RuntimeMessageType.GET_SETTINGS });
}

export function putGuardSettings(patch: Partial<GuardSettings>): Promise<GuardSettings> {
  return sendMessage<GuardSettings>({
    type: RuntimeMessageType.UPDATE_SETTINGS,
    payload: patch
  });
}

export function addGuardLog(entry: GuardLogEntry): Promise<void> {
  return sendMessage<void>({
    type: RuntimeMessageType.ADD_LOG,
    payload: entry
  });
}

export function getGuardLogs(): Promise<GuardLogEntry[]> {
  return sendMessage<GuardLogEntry[]>({
    type: RuntimeMessageType.GET_LOGS
  });
}

export function clearGuardLogs(): Promise<GuardLogEntry[]> {
  return sendMessage<GuardLogEntry[]>({
    type: RuntimeMessageType.CLEAR_LOGS
  });
}
