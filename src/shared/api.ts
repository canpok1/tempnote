// フロントとサーバーのやり取りの定義。両方がこのファイルを import する。

export type Status = {
  /** どの環境で動いているか */
  environment: "gas" | "local";
  /** データの置き場所（本番はスプレッドシート名） */
  storage: string;
  /** 利用者のメールアドレス。取れないときは空文字 */
  user: string;
  /** サーバーの現在時刻（ISO 形式） */
  serverTime: string;
};

export type Api = {
  getStatus: { input: undefined; output: Status };
};

export type ApiMethod = keyof Api;
