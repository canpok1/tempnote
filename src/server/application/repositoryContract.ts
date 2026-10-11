// Repository の契約テスト。ローカル版と GAS 版の両方に同じケースを当て、挙動のずれを防ぐ。
// 各実装のテスト（*.test.ts）から呼ぶ。

import { describe, expect, it } from "vitest";
import type { Memo } from "../domain/memo";
import { newNotebook } from "../domain/notebook";
import type { MemoRepository, NotebookRepository } from "./ports";

type Repositories = { notebooks: NotebookRepository; memos: MemoRepository };

const ID = "0123456789abcdef0123456789abcdef";
const OTHER_ID = "fedcba9876543210fedcba9876543210";

const memo = (id: string, title: string): Memo => ({
  id,
  title,
  body: "# 見出し\n\n- 1\n- 2",
  createdAt: "2026-10-11T00:00:00.000Z",
  updatedAt: "2026-10-11T00:00:00.123Z",
  updatedBy: "a@example.com",
});

export const describeRepositoryContract = (name: string, create: () => Repositories) => {
  describe(`${name}: Repository の契約`, () => {
    it("作ったメモ帳を ID で取り出せる", () => {
      const { notebooks } = create();
      const notebook = newNotebook(ID, new Date("2026-10-11T00:00:00.000Z"));

      notebooks.create(notebook);

      expect(notebooks.find(ID)).toEqual(notebook);
    });

    it("無い ID は null", () => {
      const { notebooks } = create();
      notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));

      expect(notebooks.find(OTHER_ID)).toBeNull();
    });

    it("更新した内容が次に取り出したときに反映され、他のメモ帳は変わらない", () => {
      const { notebooks } = create();
      const notebook = newNotebook(ID, new Date("2026-10-11T00:00:00.000Z"));
      const other = newNotebook(OTHER_ID, new Date("2026-10-11T00:00:00.000Z"));
      notebooks.create(notebook);
      notebooks.create(other);

      notebooks.update({ ...notebook, lastAccessedAt: "2026-10-12T00:00:00.000Z" });

      expect(notebooks.find(ID)?.lastAccessedAt).toBe("2026-10-12T00:00:00.000Z");
      expect(notebooks.find(OTHER_ID)).toEqual(other);
    });

    it("取り出したオブジェクトを書き換えても保存内容は変わらない", () => {
      const { notebooks } = create();
      notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));

      const found = notebooks.find(ID);
      if (found) found.lastAccessedAt = "changed";

      expect(notebooks.find(ID)?.lastAccessedAt).toBe("2026-10-11T00:00:00.000Z");
    });

    it("作ったばかりのメモ帳にメモは無い", () => {
      const { notebooks, memos } = create();
      notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));

      expect(memos.list(ID)).toEqual([]);
    });

    it("保存したメモを作成順に一覧でき、ID で取り出せる", () => {
      const { notebooks, memos } = create();
      notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));

      memos.save(ID, memo("m1", "1件目"));
      memos.save(ID, memo("m2", "2件目"));

      expect(memos.list(ID).map((m) => m.title)).toEqual(["1件目", "2件目"]);
      expect(memos.find(ID, "m2")).toEqual(memo("m2", "2件目"));
    });

    it("同じ ID で保存すると上書きし、件数も並びも変わらない", () => {
      const { notebooks, memos } = create();
      notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));
      memos.save(ID, memo("m1", "1件目"));
      memos.save(ID, memo("m2", "2件目"));

      memos.save(ID, { ...memo("m1", "書き換え"), updatedBy: "" });

      expect(memos.list(ID).map((m) => [m.id, m.title])).toEqual([
        ["m1", "書き換え"],
        ["m2", "2件目"],
      ]);
      expect(memos.find(ID, "m1")?.updatedBy).toBe("");
    });

    it("メモは他のメモ帳から見えず、無いメモは null", () => {
      const { notebooks, memos } = create();
      notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));
      notebooks.create(newNotebook(OTHER_ID, new Date("2026-10-11T00:00:00.000Z")));
      memos.save(ID, memo("m1", "1件目"));

      expect(memos.list(OTHER_ID)).toEqual([]);
      expect(memos.find(OTHER_ID, "m1")).toBeNull();
      expect(memos.find(ID, "m9")).toBeNull();
    });

    it("削除したメモは一覧からも ID でも消え、他のメモは並びを保って残る", () => {
      const { notebooks, memos } = create();
      notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));
      memos.save(ID, memo("m1", "1件目"));
      memos.save(ID, memo("m2", "2件目"));
      memos.save(ID, memo("m3", "3件目"));

      memos.delete(ID, "m2");

      expect(memos.list(ID).map((m) => m.id)).toEqual(["m1", "m3"]);
      expect(memos.find(ID, "m2")).toBeNull();
    });

    it("最後の1件も削除でき、その後また保存できる", () => {
      const { notebooks, memos } = create();
      notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));
      memos.save(ID, memo("m1", "1件目"));

      memos.delete(ID, "m1");
      memos.save(ID, memo("m2", "2件目"));

      expect(memos.list(ID).map((m) => m.id)).toEqual(["m2"]);
    });

    it("無いメモの削除は何もしない", () => {
      const { notebooks, memos } = create();
      notebooks.create(newNotebook(ID, new Date("2026-10-11T00:00:00.000Z")));
      memos.save(ID, memo("m1", "1件目"));

      memos.delete(ID, "m9");
      memos.delete(OTHER_ID, "m1");

      expect(memos.list(ID).map((m) => m.id)).toEqual(["m1"]);
    });
  });
};
