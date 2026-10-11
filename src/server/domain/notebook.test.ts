import { describe, expect, it } from "vitest";
import { NotFoundError } from "../../shared/errors";
import { assertNotebookId, isExpired, newNotebook, touchNotebook } from "./notebook";

describe("newNotebook", () => {
  it("作成日時と最終アクセス日時を同じ時刻にする", () => {
    expect(newNotebook("a".repeat(32), new Date("2026-10-11T00:00:00.000Z"))).toEqual({
      id: "a".repeat(32),
      createdAt: "2026-10-11T00:00:00.000Z",
      lastAccessedAt: "2026-10-11T00:00:00.000Z",
    });
  });
});

describe("touchNotebook", () => {
  it("最終アクセス日時だけを進める", () => {
    const notebook = newNotebook("a".repeat(32), new Date("2026-10-11T00:00:00.000Z"));

    expect(touchNotebook(notebook, new Date("2026-10-12T00:00:00.000Z"))).toEqual({
      ...notebook,
      lastAccessedAt: "2026-10-12T00:00:00.000Z",
    });
  });
});

describe("isExpired", () => {
  const notebook = newNotebook("a".repeat(32), new Date("2026-10-01T00:00:00.000Z"));

  it("最終アクセスから30日に1ミリ秒足りなければ期限内", () => {
    expect(isExpired(notebook, new Date("2026-10-30T23:59:59.999Z"), 30)).toBe(false);
  });

  it("最終アクセスからちょうど30日で期限切れ", () => {
    expect(isExpired(notebook, new Date("2026-10-31T00:00:00.000Z"), 30)).toBe(true);
  });

  it("日数を変えるとその日数で判定する", () => {
    expect(isExpired(notebook, new Date("2026-10-07T23:59:59.999Z"), 7)).toBe(false);
    expect(isExpired(notebook, new Date("2026-10-08T00:00:00.000Z"), 7)).toBe(true);
  });
});

describe("assertNotebookId", () => {
  it("小文字16進の32文字を受け付ける", () => {
    expect(() => assertNotebookId("0123456789abcdef0123456789abcdef")).not.toThrow();
  });

  it.each([undefined, 1, "", "x", "0123456789ABCDEF0123456789ABCDEF", "0123456789abcdef0123456789abcde", "nb_../x"])(
    "%j は見つからない扱いにする",
    (id) => {
      expect(() => assertNotebookId(id)).toThrow(NotFoundError);
    },
  );
});
