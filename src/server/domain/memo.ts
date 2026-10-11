// メモ。メモ帳の中に入る。

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
