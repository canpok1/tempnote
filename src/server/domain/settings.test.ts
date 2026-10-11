import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, parseSettings } from "./settings";

describe("parseSettings", () => {
  it("何も無ければ既定値（30日・毎日）", () => {
    expect(parseSettings({})).toEqual({ expiryDays: 30, cleanupIntervalDays: 1 });
    expect(parseSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it("1以上の整数を読む。前後の空白は無視する", () => {
    expect(parseSettings({ expiryDays: " 7 ", cleanupIntervalDays: "3" })).toEqual({
      expiryDays: 7,
      cleanupIntervalDays: 3,
    });
  });

  it.each(["", "0", "-1", "1.5", "abc", "7日"])("%j は既定値にする", (value) => {
    expect(parseSettings({ expiryDays: value, cleanupIntervalDays: value })).toEqual(DEFAULT_SETTINGS);
  });

  it("知らないキーは無視する", () => {
    expect(parseSettings({ other: "5" })).toEqual(DEFAULT_SETTINGS);
  });
});
