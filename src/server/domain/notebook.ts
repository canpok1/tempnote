// メモ帳。ID を知っている人なら誰でも開ける単位で、最終アクセスから30日で消える。

import { NotFoundError } from "../../shared/errors";

export type Notebook = {
  /** UUID v4 からハイフンを抜いた32文字 */
  id: string;
  /** ISO 形式（ミリ秒まで） */
  createdAt: string;
  /** ISO 形式（ミリ秒まで）。メモ帳のどの画面を開いても更新する */
  lastAccessedAt: string;
};

const ID_PATTERN = /^[0-9a-f]{32}$/;

/** 最後に開いてからこの日数がたったメモ帳は、中のメモごと削除する */
export const EXPIRY_DAYS = 30;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export const newNotebook = (id: string, now: Date): Notebook => ({
  id,
  createdAt: now.toISOString(),
  lastAccessedAt: now.toISOString(),
});

export const touchNotebook = (notebook: Notebook, now: Date): Notebook => ({
  ...notebook,
  lastAccessedAt: now.toISOString(),
});

/** 最終アクセスからちょうど30日たった時点で期限切れになる */
export const isExpired = (notebook: Notebook, now: Date): boolean =>
  now.getTime() - new Date(notebook.lastAccessedAt).getTime() >= EXPIRY_MS;

/**
 * URL から来た ID が形として正しいか確かめる。形が違う ID のメモ帳は存在し得ないので、見つからない扱いにする。
 * GAS ではシート名に ID を使うため、ここで弾いておく。
 */
export function assertNotebookId(id: unknown): asserts id is string {
  if (typeof id !== "string" || !ID_PATTERN.test(id)) throw new NotFoundError("メモ帳が見つかりません");
}
