import { describe, expect, it } from "vitest";
import { LogStore } from "../../background/log-store";
import type { GuardLogEntry } from "../../shared/types";

function createEntry(id: string, timestamp: number): GuardLogEntry {
  return {
    id,
    timestamp,
    site: "chatgpt.com",
    trigger: "enter",
    action: "allow",
    riskLevel: "low",
    hitTypes: [],
    hitCount: 0,
    sources: [],
    warnings: []
  };
}

describe("LogStore", () => {
  it("drops expired entries by ttl", () => {
    let now = 10 * 24 * 60 * 60 * 1000;
    const store = new LogStore({
      retentionDays: 7,
      maxEntries: 10,
      maxBytes: 1024 * 1024,
      now: () => now
    });

    store.hydrate([createEntry("old", 1), createEntry("new", now - 2 * 24 * 60 * 60 * 1000)]);
    const list = store.list();
    expect(list.map((item) => item.id)).toEqual(["new"]);
  });

  it("drops oldest entries when max size exceeded", () => {
    const now = 3;
    const store = new LogStore({
      retentionDays: 30,
      maxEntries: 2,
      maxBytes: 1024 * 1024,
      now: () => now
    });
    store.add(createEntry("1", 1));
    store.add(createEntry("2", 2));
    store.add(createEntry("3", 3));

    expect(store.list().map((item) => item.id)).toEqual(["3", "2"]);
  });

  it("drops oldest entries when max bytes exceeded", () => {
    const store = new LogStore({
      retentionDays: 30,
      maxEntries: 20,
      maxBytes: 1,
      now: () => Date.now()
    });

    store.add(createEntry("1", 1));
    expect(store.list()).toHaveLength(0);
  });
});
