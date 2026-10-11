// フロントとサーバーのやり取りの定義。両方がこのファイルを import する。
// 日時は Date ではなく ISO 形式の文字列で運ぶ（google.script.run は Date を渡せない）。

export type MemoSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type Api = {
  createNotebook: { input: undefined; output: { notebookId: string } };
  /** メモ帳を開く。最終アクセス日時も更新する。メモ帳が無ければ NotFoundError */
  listMemos: { input: { notebookId: string }; output: MemoSummary[] };
};

export type ApiMethod = keyof Api;
