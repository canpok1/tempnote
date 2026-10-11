import { afterEach, describe, expect, it, vi } from "vitest";
import type { Lock } from "../../application/ports";
import { DAILY_HANDLER, ensureDailyTrigger } from "./dailyTrigger";

const run = vi.fn((task: () => unknown) => task());
const lock = { run } as unknown as Lock;

/** ScriptApp のうちトリガーまわりだけを真似る */
const installFakeScriptApp = (handlers: string[]) => {
  const create = vi.fn(() => {
    handlers.push(DAILY_HANDLER);
  });
  const builder = { timeBased: () => builder, everyDays: () => builder, atHour: () => builder, create };
  vi.stubGlobal("ScriptApp", {
    getProjectTriggers: () => handlers.map((h) => ({ getHandlerFunction: () => h })),
    newTrigger: vi.fn(() => builder),
  });
  return { create };
};

afterEach(() => {
  vi.unstubAllGlobals();
  run.mockClear();
});

describe("ensureDailyTrigger", () => {
  it("トリガーが無ければロックの中で1つ作り、2回目は作らない", () => {
    const fake = installFakeScriptApp([]);

    ensureDailyTrigger(lock);
    ensureDailyTrigger(lock);

    expect(fake.create).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("別の関数のトリガーしか無ければ作る", () => {
    const fake = installFakeScriptApp(["other"]);

    ensureDailyTrigger(lock);

    expect(fake.create).toHaveBeenCalledTimes(1);
  });

  it("すでにあればロックも取らない", () => {
    const fake = installFakeScriptApp([DAILY_HANDLER]);

    ensureDailyTrigger(lock);

    expect(fake.create).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });
});
