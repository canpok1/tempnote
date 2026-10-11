// GAS の HtmlService が画面の iframe に差し込む google.script の型。このアプリで使う部分だけを書く。
// ローカル（vite の開発サーバー）には存在しないので、GAS 向けのアダプタからだけ呼ぶ。

import type { Envelope } from "../shared/envelope";

export type GasLocation = {
  hash: string;
  /** 同じ名前が複数あるときは最初の値 */
  parameter: Record<string, string>;
  parameters: Record<string, string[]>;
};

type Run = {
  withSuccessHandler(handler: (value: Envelope) => void): Run;
  withFailureHandler(handler: (error: Error) => void): Run;
  api(method: string, input: unknown): void;
};

export type GoogleScript = {
  run: Run;
  url: { getLocation(callback: (location: GasLocation) => void): void };
  history: {
    /** params が空オブジェクトならパラメータを消し、null なら今のまま残す。hash も同じ */
    push(state: unknown, params: Record<string, string> | null, hash: string | null): void;
    /** push と同じだが、履歴を積まずに今の項目を置き換える */
    replace(state: unknown, params: Record<string, string> | null, hash: string | null): void;
    /** 戻る・進むのときに呼ばれる。登録できるのは1つだけ */
    setChangeHandler(handler: (event: { state: unknown; location: GasLocation }) => void): void;
  };
};

declare const google: { script: GoogleScript };

export const googleScript = (): GoogleScript => google.script;
