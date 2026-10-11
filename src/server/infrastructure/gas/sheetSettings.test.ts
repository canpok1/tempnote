import { describe, expect, it } from "vitest";
import { FakeBook } from "./fakeSpreadsheet";
import { createSheetSettings, SETTINGS_SHEET } from "./sheetSettings";

const header = ["key", "value", "description"];

const bookWith = (rows: string[][]) => {
  const book = new FakeBook();
  const sheet = book.insertSheet(SETTINGS_SHEET);
  sheet.cells = [header, ...rows];
  return book;
};

describe("createSheetSettings", () => {
  it("シートが無ければ既定値を返し、シートは作らない", () => {
    const book = new FakeBook();
    const settings = createSheetSettings(() => book);

    expect(settings.inspect()).toEqual({ settings: { expiryDays: 30, cleanupIntervalDays: 1 }, complete: false });
    expect(book.sheets.has(SETTINGS_SHEET)).toBe(false);
  });

  it("fillDefaults でシートを作り、既定値と説明を書く", () => {
    const book = new FakeBook();
    const settings = createSheetSettings(() => book);

    settings.fillDefaults();

    const cells = book.sheets.get(SETTINGS_SHEET)?.cells ?? [];
    expect(cells.map((row) => row.slice(0, 2))).toEqual([
      ["key", "value"],
      ["expiryDays", "30"],
      ["cleanupIntervalDays", "1"],
    ]);
    expect(cells[1][2]).toContain("削除");
    expect(settings.inspect().complete).toBe(true);
  });

  it("書き換えた値を読む。数値のセルも読める", () => {
    const book = bookWith([
      ["expiryDays", "7", ""],
      ["cleanupIntervalDays", 3 as unknown as string, ""],
    ]);

    expect(createSheetSettings(() => book).load()).toEqual({ expiryDays: 7, cleanupIntervalDays: 3 });
  });

  it("足りない項目だけを書き足し、書き換えた値は残す", () => {
    const book = bookWith([["expiryDays", "7", "メモ"]]);
    const settings = createSheetSettings(() => book);

    expect(settings.inspect().complete).toBe(false);
    settings.fillDefaults();

    expect(book.sheets.get(SETTINGS_SHEET)?.cells.map((row) => row.slice(0, 3))).toEqual([
      header,
      ["expiryDays", "7", "メモ"],
      ["cleanupIntervalDays", "1", expect.any(String)],
    ]);
    expect(settings.load()).toEqual({ expiryDays: 7, cleanupIntervalDays: 1 });
  });

  it("同じキーが複数あれば上の行を使う", () => {
    const book = bookWith([
      ["expiryDays", "7", ""],
      ["expiryDays", "14", ""],
    ]);

    expect(createSheetSettings(() => book).load().expiryDays).toBe(7);
  });
});
