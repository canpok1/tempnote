// ローカル用の Repository。データはメモリに持ち、開発サーバーを再起動すると消える。
// Vite はサーバー側のコードを変えるたびに読み込み直すので、データは globalThis に置いて読み込み直しでは消えないようにする。

import type { MemoRepository, NotebookRepository } from "../../application/ports";
import type { Memo } from "../../domain/memo";
import type { Notebook } from "../../domain/notebook";

export type MemoryStore = {
  notebooks: Map<string, Notebook>;
  memos: Map<string, Memo[]>;
  /** 設定のキーと値。GAS 版の settings シートと同じく文字列で持つ（開発用の口から書き換える） */
  settings: Record<string, string>;
  /** 時計をどれだけ進めているか（開発用） */
  clockOffsetMs: number;
};

export const createMemoryStore = (): MemoryStore => ({
  notebooks: new Map(),
  memos: new Map(),
  settings: {},
  clockOffsetMs: 0,
});

const GLOBAL_KEY = "__tempnoteMemoryStore";

/** 開発サーバーの中で共有する置き場所 */
export const sharedMemoryStore = (): MemoryStore => {
  const holder = globalThis as { [GLOBAL_KEY]?: MemoryStore };
  holder[GLOBAL_KEY] ??= createMemoryStore();
  return holder[GLOBAL_KEY];
};

// GAS 版はシートから毎回新しいオブジェクトを読むので、それに合わせて複製して渡す
const copy = <T>(value: T): T => structuredClone(value);

export const createMemoryRepositories = (
  store: MemoryStore,
): { notebooks: NotebookRepository; memos: MemoRepository } => ({
  notebooks: {
    create: (notebook) => {
      store.notebooks.set(notebook.id, copy(notebook));
      store.memos.set(notebook.id, []);
    },
    find: (id) => {
      const notebook = store.notebooks.get(id);
      return notebook ? copy(notebook) : null;
    },
    update: (notebook) => {
      if (!store.notebooks.has(notebook.id)) throw new Error(`notebook not found: ${notebook.id}`);
      store.notebooks.set(notebook.id, copy(notebook));
    },
    list: () => copy([...store.notebooks.values()]),
    delete: (id) => {
      store.notebooks.delete(id);
      store.memos.delete(id);
    },
  },
  memos: {
    list: (notebookId) => copy(store.memos.get(notebookId) ?? []),
    find: (notebookId, memoId) => {
      const memo = store.memos.get(notebookId)?.find((m) => m.id === memoId);
      return memo ? copy(memo) : null;
    },
    save: (notebookId, memo) => {
      const list = store.memos.get(notebookId) ?? [];
      const index = list.findIndex((m) => m.id === memo.id);
      if (index >= 0) list[index] = copy(memo);
      else list.push(copy(memo));
      store.memos.set(notebookId, list);
    },
    delete: (notebookId, memoId) => {
      const list = store.memos.get(notebookId);
      if (list)
        store.memos.set(
          notebookId,
          list.filter((m) => m.id !== memoId),
        );
    },
  },
});
