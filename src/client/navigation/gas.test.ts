import { afterEach, describe, expect, it, vi } from "vitest";
import type { GasLocation, GoogleScript } from "../googleScript";

const location = (parameter: Record<string, string>): GasLocation => ({
  hash: "",
  parameter,
  parameters: Object.fromEntries(Object.entries(parameter).map(([k, v]) => [k, [v]])),
});

/** google.script の url / history だけを真似る */
const installFakeGoogleScript = (initial: Record<string, string>) => {
  let changeHandler: ((event: { state: unknown; location: GasLocation }) => void) | undefined;
  const history = {
    push: vi.fn(),
    replace: vi.fn(),
    setChangeHandler: vi.fn((handler) => {
      changeHandler = handler;
    }),
  };
  const script: Partial<GoogleScript> = {
    url: { getLocation: (callback) => callback(location(initial)) },
    history,
  };
  vi.stubGlobal("google", { script });
  return {
    history,
    popTo: (parameter: Record<string, string>) => changeHandler?.({ state: null, location: location(parameter) }),
  };
};

const load = async () => {
  vi.resetModules();
  return (await import("./gas")).gasNavigation;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("gasNavigation", () => {
  it("今のパラメータを google.script.url から読む", async () => {
    installFakeGoogleScript({ id: "nb1" });
    const navigation = await load();

    await expect(navigation.current()).resolves.toEqual({ id: "nb1" });
  });

  it("パラメータを丸ごと置き換え、ハッシュを消して履歴を積む", async () => {
    const fake = installFakeGoogleScript({});
    const navigation = await load();

    navigation.push({ id: "nb1", memo: "m1" });

    expect(fake.history.push).toHaveBeenCalledWith(null, { id: "nb1", memo: "m1" }, "");
  });

  it("replace は履歴を積まずに置き換える", async () => {
    const fake = installFakeGoogleScript({});
    const navigation = await load();

    navigation.replace({ id: "nb1" });

    expect(fake.history.replace).toHaveBeenCalledWith(null, { id: "nb1" }, "");
    expect(fake.history.push).not.toHaveBeenCalled();
  });

  it("戻る・進むの通知を登録中のリスナー全員に配り、外したリスナーには配らない", async () => {
    const fake = installFakeGoogleScript({});
    const navigation = await load();
    const first = vi.fn();
    const second = vi.fn();

    const off = navigation.onChange(first);
    navigation.onChange(second);
    off();
    fake.popTo({ id: "nb1" });

    expect(fake.history.setChangeHandler).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ id: "nb1" });
  });
});
