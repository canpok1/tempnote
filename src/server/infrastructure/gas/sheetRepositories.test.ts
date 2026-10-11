import { describe, expect, it } from "vitest";
import { describeRepositoryContract } from "../../application/repositoryContract";
import { newNotebook } from "../../domain/notebook";
import { FakeBook } from "./fakeSpreadsheet";
import { createSheetRepositories, memoSheetName } from "./sheetRepositories";

describeRepositoryContract("スプレッドシート", () => {
  const book = new FakeBook();
  return createSheetRepositories(() => book);
});

const ID = "0123456789abcdef0123456789abcdef";

describe("createSheetRepositories のシートの形", () => {
  it("メモ帳を作ると notebooks と nb_<ID> の2枚ができ、どちらもヘッダー1行と必要な列だけに縮む", () => {
    const book = new FakeBook();
    const { notebooks } = createSheetRepositories(() => book);

    notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));

    const index = book.sheets.get("notebooks");
    const memos = book.sheets.get(memoSheetName(ID));
    expect(index?.cells).toEqual([
      ["id", "createdAt", "lastAccessedAt"],
      [ID, "2026-10-11T00:00:00.000Z", "2026-10-11T00:00:00.000Z"],
    ]);
    expect(memos?.cells).toEqual([["id", "title", "body", "createdAt", "updatedAt", "updatedBy"]]);
    expect([memos?.maxRows, memos?.maxColumns]).toEqual([1, 6]);
  });

  it("書いたセルは書式なしテキストにする（日時や ID が日付・数値に変換されないように）", () => {
    const book = new FakeBook();
    const { notebooks } = createSheetRepositories(() => book);

    notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));

    expect(book.sheets.get("notebooks")?.textCells).toContain("2,1");
    expect(book.sheets.get("notebooks")?.textCells).toContain("2,3");
  });

  it("列の並びではなくヘッダー名で読み、知らない列は書き換えない", () => {
    const book = new FakeBook();
    const sheet = book.insertSheet("notebooks");
    sheet.cells = [
      ["memo", "lastAccessedAt", "id", "createdAt"],
      ["手で書いた", "2026-10-11T00:00:00.000Z", ID, "2026-10-10T00:00:00.000Z"],
    ];
    const { notebooks } = createSheetRepositories(() => book);

    notebooks.update({ id: ID, createdAt: "2026-10-10T00:00:00.000Z", lastAccessedAt: "2026-10-12T00:00:00.000Z" });

    expect(sheet.cells[1]).toEqual(["手で書いた", "2026-10-12T00:00:00.000Z", ID, "2026-10-10T00:00:00.000Z"]);
  });

  it("日付に変換されてしまったセルは ISO 形式の文字列に戻して読む", () => {
    const book = new FakeBook();
    book.insertSheet("notebooks").cells = [
      ["id", "createdAt", "lastAccessedAt"],
      [ID, new Date("2026-10-10T00:00:00.000Z"), "2026-10-11T00:00:00.000Z"],
    ];
    const { notebooks } = createSheetRepositories(() => book);

    expect(notebooks.find(ID)?.createdAt).toBe("2026-10-10T00:00:00.000Z");
  });

  it("シートのヘッダーが足りなければ列を足して書く", () => {
    const book = new FakeBook();
    const sheet = book.insertSheet("notebooks");
    sheet.maxColumns = 2;
    sheet.cells = [["id", "createdAt"]];
    const { notebooks } = createSheetRepositories(() => book);

    notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));

    expect(sheet.cells[0]).toEqual(["id", "createdAt", "lastAccessedAt"]);
    expect(notebooks.find(ID)?.lastAccessedAt).toBe("2026-10-11T00:00:00.000Z");
  });

  it("メモ帳を削除すると nb_<ID> シートと notebooks の行が消える", () => {
    const book = new FakeBook();
    const { notebooks } = createSheetRepositories(() => book);
    notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));

    notebooks.delete(ID);

    expect([...book.sheets.keys()]).toEqual(["notebooks"]);
    expect(book.sheets.get("notebooks")?.cells).toEqual([["id", "createdAt", "lastAccessedAt"]]);
  });
});
