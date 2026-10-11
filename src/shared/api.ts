// フロントとサーバーのやり取りの定義。両方がこのファイルを import する。
// 日時は Date ではなく ISO 形式の文字列で運ぶ（google.script.run は Date を渡せない）。

export type MemoSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type Memo = MemoSummary & {
  /** Markdown の本文 */
  body: string;
  createdAt: string;
  /** 更新者のメールアドレス。取れなかったときは空文字 */
  updatedBy: string;
};

export type SaveMemoInput = {
  notebookId: string;
  /** 無ければ新しいメモを作る */
  memoId?: string;
  title: string;
  body: string;
  /** 編集を始めたときのメモの updatedAt。同時編集の検知に使う */
  baseUpdatedAt?: string;
};

export type Api = {
  createNotebook: { input: undefined; output: { notebookId: string } };
  /** メモ帳を開く。最終アクセス日時も更新する。メモ帳が無ければ NotFoundError */
  listMemos: { input: { notebookId: string }; output: MemoSummary[] };
  /** メモ帳かメモが無ければ NotFoundError */
  getMemo: { input: { notebookId: string; memoId: string }; output: Memo };
  /**
   * 新規作成と更新。100件を超える・文字数を超えると LimitExceededError。
   * 更新では、編集を始めた後に誰かが先に更新していたら保存せずに ConflictError
   */
  saveMemo: { input: SaveMemoInput; output: Memo };
  /** 編集を始めた後に誰かが先に更新していたら削除せずに ConflictError */
  deleteMemo: { input: { notebookId: string; memoId: string; baseUpdatedAt: string }; output: null };
};

export type ApiMethod = keyof Api;
export type ApiInput<M extends ApiMethod> = Api[M]["input"];
export type ApiOutput<M extends ApiMethod> = Api[M]["output"];
