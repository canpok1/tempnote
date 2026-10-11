// アプリケーション層がインフラ層に求めるもの。本番（GAS）とローカルで実装を差し替える。

import type { Memo } from "../domain/memo";
import type { Notebook } from "../domain/notebook";

export type NotebookRepository = {
  /** 新しいメモ帳を保存する。メモを入れる場所もここで用意する */
  create(notebook: Notebook): void;
  /** 無ければ null */
  find(id: string): Notebook | null;
  /** 既存のメモ帳を上書きする */
  update(notebook: Notebook): void;
  /** すべてのメモ帳 */
  list(): Notebook[];
  /** メモ帳を中のメモごと削除する。無ければ何もしない */
  delete(id: string): void;
};

export type MemoRepository = {
  /** メモ帳の中のメモ。作成順 */
  list(notebookId: string): Memo[];
  /** 無ければ null */
  find(notebookId: string, memoId: string): Memo | null;
  /** 同じ ID のメモがあれば上書きし、無ければ末尾に足す */
  save(notebookId: string, memo: Memo): void;
  /** 無ければ何もしない */
  delete(notebookId: string, memoId: string): void;
};

export type Clock = { now(): Date };

export type CurrentUser = {
  /** 操作している人のメールアドレス。取れないときは空文字 */
  email(): string;
};

export type IdGenerator = {
  /** 推測されにくいランダムな ID（UUID v4 からハイフンを抜いた32文字） */
  generate(): string;
};

/** 書き込みを直列化する。読んでから書くまでの間に、別の利用者の書き込みが割り込まないようにする */
export type Lock = { run<T>(task: () => T): T };

export type Ports = {
  notebooks: NotebookRepository;
  memos: MemoRepository;
  clock: Clock;
  user: CurrentUser;
  ids: IdGenerator;
  lock: Lock;
};
