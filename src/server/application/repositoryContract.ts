// Repository の契約テスト。ローカル版と GAS 版の両方に同じケースを当て、挙動のずれを防ぐ。
// 各実装のテスト（*.test.ts）から呼ぶ。

import { describe, expect, it } from "vitest";
import { newNotebook } from "../domain/notebook";
import type { MemoRepository, NotebookRepository } from "./ports";

type Repositories = { notebooks: NotebookRepository; memos: MemoRepository };

const ID = "0123456789abcdef0123456789abcdef";
const OTHER_ID = "fedcba9876543210fedcba9876543210";

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
  });
};
