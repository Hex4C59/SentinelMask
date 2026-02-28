import type { GuardLogEntry } from "../shared/types";

export interface LogStoreConfig {
  retentionDays: number;
  maxEntries: number;
  maxBytes: number;
  now?: () => number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function sortByTimestampAsc(entries: GuardLogEntry[]): GuardLogEntry[] {
  return [...entries].sort((a, b) => a.timestamp - b.timestamp);
}

export class LogStore {
  private config: LogStoreConfig;
  private entries: GuardLogEntry[] = [];

  constructor(config: LogStoreConfig) {
    this.config = { ...config, now: config.now ?? Date.now };
  }

  updateConfig(config: Partial<Omit<LogStoreConfig, "now">>): void {
    this.config = {
      ...this.config,
      ...config
    };
    this.prune();
  }

  hydrate(entries: GuardLogEntry[]): void {
    this.entries = sortByTimestampAsc(entries);
    this.prune();
  }

  add(entry: GuardLogEntry): GuardLogEntry[] {
    this.entries.push(entry);
    this.prune();
    return this.list();
  }

  list(): GuardLogEntry[] {
    this.prune();
    return [...this.entries].sort((a, b) => b.timestamp - a.timestamp);
  }

  clear(): void {
    this.entries = [];
  }

  private prune(): void {
    const now = (this.config.now ?? Date.now)();
    const expiresBefore = now - this.config.retentionDays * DAY_MS;

    const afterTtl = this.entries.filter((entry) => entry.timestamp >= expiresBefore);
    const ordered = sortByTimestampAsc(afterTtl);

    while (ordered.length > this.config.maxEntries) {
      ordered.shift();
    }

    while (ordered.length > 0 && this.getByteSize(ordered) > this.config.maxBytes) {
      ordered.shift();
    }

    this.entries = ordered;
  }

  private getByteSize(entries: GuardLogEntry[]): number {
    return new TextEncoder().encode(JSON.stringify(entries)).length;
  }
}
