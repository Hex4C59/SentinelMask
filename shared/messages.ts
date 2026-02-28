import type { GuardLogEntry, GuardSettings } from "./types";

export const RuntimeMessageType = {
  GET_SETTINGS: "GET_SETTINGS",
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
  ADD_LOG: "ADD_LOG",
  GET_LOGS: "GET_LOGS",
  CLEAR_LOGS: "CLEAR_LOGS"
} as const;

export type RuntimeMessageType = (typeof RuntimeMessageType)[keyof typeof RuntimeMessageType];

export type RuntimeMessage =
  | { type: typeof RuntimeMessageType.GET_SETTINGS }
  | { type: typeof RuntimeMessageType.UPDATE_SETTINGS; payload: Partial<GuardSettings> }
  | { type: typeof RuntimeMessageType.ADD_LOG; payload: GuardLogEntry }
  | { type: typeof RuntimeMessageType.GET_LOGS }
  | { type: typeof RuntimeMessageType.CLEAR_LOGS };

export interface RuntimeResponseSuccess<T> {
  ok: true;
  data: T;
}

export interface RuntimeResponseFailure {
  ok: false;
  error: string;
}

export type RuntimeResponse<T> = RuntimeResponseSuccess<T> | RuntimeResponseFailure;
