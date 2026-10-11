// アプリケーション層がインフラ層に求めるもの。本番とローカルで実装を差し替える。

export type Environment = {
  name: "gas" | "local";
  /** データの置き場所の説明 */
  describeStorage(): string;
  /** 利用者のメールアドレス。取れないときは空文字 */
  currentUserEmail(): string;
  now(): Date;
};
