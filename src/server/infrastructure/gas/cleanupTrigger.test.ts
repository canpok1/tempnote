import { afterEach, describe, expect, it, vi } from "vitest";
import type { Lock } from "../../application/ports";
import { CLEANUP_HANDLER, ensureCleanupTrigger } from "./cleanupTrigger";

const run = vi.fn((task: () => unknown) => task());
const lock = { run } as unknown as Lock;

type FakeTrigger = { handler: string; everyDays?: number };

/** ScriptApp のトリガーまわりと、スクリプトのプロパティを真似る */
const installFakes = (triggers: FakeTrigger[], properties: Record<string, string> = {}) => {
  const create = vi.fn();
  const newTrigger = (handler: string) => {
    const trigger: FakeTrigger = { handler };
    const builder = {
      timeBased: () => builder,
      everyDays: (n: number) => {
        if (n > 1000) throw new Error("間隔が長すぎます");
        trigger.everyDays = n;
        return builder;
      },
      atHour: () => builder,
      create: () => {
        create();
        triggers.push(trigger);
      },
    };
    return builder;
  };
  vi.stubGlobal("ScriptApp", {
    getProjectTriggers: () => triggers.map((t) => ({ t, getHandlerFunction: () => t.handler })),
    newTrigger,
    deleteTrigger: ({ t }: { t: FakeTrigger }) => triggers.splice(triggers.indexOf(t), 1),
  });
  vi.stubGlobal("PropertiesService", {
    getScriptProperties: () => ({
      getProperty: (key: string) => properties[key] ?? null,
      setProperty: (key: string, value: string) => {
        properties[key] = value;
      },
    }),
  });
  return { create };
};

afterEach(() => {
  vi.unstubAllGlobals();
  run.mockClear();
});

describe("ensureCleanupTrigger", () => {
  it("トリガーが無ければロックの中で1つ作り、2回目は作らない", () => {
    const triggers: FakeTrigger[] = [];
    const fake = installFakes(triggers);

    ensureCleanupTrigger(lock, 1);
    ensureCleanupTrigger(lock, 1);

    expect(fake.create).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);
    expect(triggers).toEqual([{ handler: CLEANUP_HANDLER, everyDays: 1 }]);
  });

  it("別の関数のトリガーは残して作る", () => {
    const triggers: FakeTrigger[] = [{ handler: "other" }];
    installFakes(triggers);

    ensureCleanupTrigger(lock, 1);

    expect(triggers).toEqual([{ handler: "other" }, { handler: CLEANUP_HANDLER, everyDays: 1 }]);
  });

  it("同じ間隔で作ってあればロックも取らない", () => {
    const fake = installFakes([{ handler: CLEANUP_HANDLER }], { cleanupIntervalDays: "1" });

    ensureCleanupTrigger(lock, 1);

    expect(fake.create).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it("間隔が変わったら作り直す", () => {
    const triggers: FakeTrigger[] = [{ handler: CLEANUP_HANDLER, everyDays: 1 }];
    installFakes(triggers, { cleanupIntervalDays: "1" });

    ensureCleanupTrigger(lock, 7);

    expect(triggers).toEqual([{ handler: CLEANUP_HANDLER, everyDays: 7 }]);
  });

  it("作るのに失敗したら古いトリガーを残す", () => {
    const triggers: FakeTrigger[] = [{ handler: CLEANUP_HANDLER, everyDays: 1 }];
    installFakes(triggers, { cleanupIntervalDays: "1" });

    expect(() => ensureCleanupTrigger(lock, 5000)).toThrow();
    expect(triggers).toEqual([{ handler: CLEANUP_HANDLER, everyDays: 1 }]);
  });

  it("間隔の控えが無い（設定を入れる前に作った）トリガーは作り直す", () => {
    const triggers: FakeTrigger[] = [{ handler: CLEANUP_HANDLER }];
    installFakes(triggers);

    ensureCleanupTrigger(lock, 1);

    expect(triggers).toEqual([{ handler: CLEANUP_HANDLER, everyDays: 1 }]);
  });

  it("同じ関数のトリガーが重複していれば1つにまとめる", () => {
    const triggers: FakeTrigger[] = [{ handler: CLEANUP_HANDLER }, { handler: CLEANUP_HANDLER }];
    installFakes(triggers, { cleanupIntervalDays: "1" });

    ensureCleanupTrigger(lock, 1);

    expect(triggers).toEqual([{ handler: CLEANUP_HANDLER, everyDays: 1 }]);
  });
});
