// メモ。メモ帳の中に入る。

import { ConflictError, LimitExceededError, NotFoundError, ValidationError } from "../../shared/errors";
import { MAX_BODY_LENGTH, MAX_MEMOS_PER_NOTEBOOK, MAX_TITLE_LENGTH } from "../../shared/limits";
import { isId } from "./id";

export type Memo = {
  id: string;
  title: string;
  /** Markdown の本文 */
  body: string;
  /** ISO 形式（ミリ秒まで） */
  createdAt: string;
  /** ISO 形式（ミリ秒まで）。同時編集の検知にも使う */
  updatedAt: string;
  /** 更新者のメールアドレス。取れないときは空文字 */
  updatedBy: string;
};

export type MemoContent = { title: string; body: string };

/** 通信路から来た入力を、タイトルと本文として確かめる */
export const validateContent = (input: { title?: unknown; body?: unknown }): MemoContent => {
  const { title, body } = input;
  if (typeof title !== "string" || typeof body !== "string") throw new ValidationError("タイトルと本文が必要です");
  if (title.length > MAX_TITLE_LENGTH) {
    throw new LimitExceededError(`タイトルは${MAX_TITLE_LENGTH}文字までです（今は${title.length}文字）`);
  }
  if (body.length > MAX_BODY_LENGTH) {
    throw new LimitExceededError(
      `本文は${MAX_BODY_LENGTH.toLocaleString()}文字までです（今は${body.length.toLocaleString()}文字）`,
    );
  }
  return { title, body };
};

/** 新しいメモを作る。今あるメモの数を渡し、上限を超えるなら作らない */
export const newMemo = (id: string, content: MemoContent, currentCount: number, now: Date, user: string): Memo => {
  if (currentCount >= MAX_MEMOS_PER_NOTEBOOK) {
    throw new LimitExceededError(`1冊のメモ帳に入るメモは${MAX_MEMOS_PER_NOTEBOOK}件までです`);
  }
  const at = now.toISOString();
  return { id, ...content, createdAt: at, updatedAt: at, updatedBy: user };
};

/**
 * 更新日時は同時編集の検知に使うので、必ず前の値より進める。
 * 時計の都合で同じミリ秒か過去になったときは、前の値の1ミリ秒後にする。
 */
const nextUpdatedAt = (previous: string, now: Date): string => {
  const after = new Date(previous).getTime() + 1;
  return new Date(Math.max(now.getTime(), after)).toISOString();
};

export const editMemo = (memo: Memo, content: MemoContent, now: Date, user: string): Memo => ({
  ...memo,
  ...content,
  updatedAt: nextUpdatedAt(memo.updatedAt, now),
  updatedBy: user,
});

/**
 * 編集を始めたときの更新日時（base）と今の更新日時を比べ、違えば誰かが先に更新したとして ConflictError にする。
 * 書き込みと同じロックの中で呼ぶ。
 */
export const assertNotStale = (memo: Memo, baseUpdatedAt: unknown): void => {
  if (typeof baseUpdatedAt !== "string" || baseUpdatedAt === "") {
    throw new ValidationError("編集を始めたときの更新日時が必要です");
  }
  if (memo.updatedAt !== baseUpdatedAt) {
    throw new ConflictError("他の人が先にこのメモを更新しました。入力した内容を控えてから、開き直してください");
  }
};

/** URL から来たメモ ID の形を確かめる。形が違う ID のメモは存在し得ないので、見つからない扱いにする */
export function assertMemoId(id: unknown): asserts id is string {
  if (!isId(id)) throw new NotFoundError("メモが見つかりません");
}
