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
};

export type MemoRepository = {
  /** メモ帳の中のメモ。作成順 */
  list(notebookId: string): Memo[];
};

export type Clock = { now(): Date };

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
  ids: IdGenerator;
  lock: Lock;
};
