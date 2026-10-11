// GAS 用の Repository。メモ帳の一覧はシート notebooks に1行1冊で持ち、メモはメモ帳ごとのシート nb_<メモ帳ID> に1行1件で持つ。

import type { MemoRepository, NotebookRepository } from "../../application/ports";
import type { Memo } from "../../domain/memo";
import type { Notebook } from "../../domain/notebook";
import { type BookLike, openTable, type Table } from "./sheets";

const NOTEBOOKS_SHEET = "notebooks";
const NOTEBOOK_COLUMNS = ["id", "createdAt", "lastAccessedAt"] as const satisfies readonly (keyof Notebook)[];
const MEMO_COLUMNS = [
  "id",
  "title",
  "body",
  "createdAt",
  "updatedAt",
  "updatedBy",
] as const satisfies readonly (keyof Memo)[];

const findRow = <C extends string>(table: Table<C | "id">, id: string) =>
  table.rows().find((row) => row.values.id === id);

export const memoSheetName = (notebookId: string) => `nb_${notebookId}`;

export const createSheetRepositories = (
  book: () => BookLike,
): { notebooks: NotebookRepository; memos: MemoRepository } => {
  const notebookTable = () => openTable(book(), NOTEBOOKS_SHEET, NOTEBOOK_COLUMNS);
  return {
    notebooks: {
      create: (notebook) => {
        notebookTable().append(notebook);
        openTable(book(), memoSheetName(notebook.id), MEMO_COLUMNS);
      },
      find: (id) => findRow(notebookTable(), id)?.values ?? null,
      update: (notebook) => {
        const table = notebookTable();
        const row = findRow(table, notebook.id);
        if (!row) throw new Error(`notebook not found: ${notebook.id}`);
        table.update(row.rowNumber, notebook);
      },
    },
    memos: {
      list: (notebookId) => {
        // シートが無いのはメモ帳が無いときだけ。呼ぶ側がメモ帳の存在を確かめているので、ここでは作らずに空とする
        if (!book().getSheetByName(memoSheetName(notebookId))) return [];
        return openTable(book(), memoSheetName(notebookId), MEMO_COLUMNS)
          .rows()
          .map((row) => row.values);
      },
    },
  };
};
