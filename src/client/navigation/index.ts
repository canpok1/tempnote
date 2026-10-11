// 画面が URL のパラメータを読み書きする唯一の口。本番は google.script.url / history、ローカルは location / history を使う。
// GAS の画面は iframe の中で動くため、location や history を直接触っても利用者が見ている URL は変わらない。
// どちらを使うかはビルド時に決まる（通信口の transport と同じ切り替え）。

import { browserNavigation } from "./browser";
import { gasNavigation } from "./gas";

export type Params = Record<string, string>;

export type Navigation = {
  /** 今の URL のパラメータ。GAS では非同期でしか取れない */
  current(): Promise<Params>;
  /** パラメータを置き換えて履歴を1つ積む。渡さなかったパラメータは消える */
  push(params: Params): void;
  /** 戻る・進むでパラメータが変わったときに呼ぶ。戻り値で登録を外す */
  onChange(listener: (params: Params) => void): () => void;
};

export const navigation: Navigation = import.meta.env.MODE === "gas" ? gasNavigation : browserNavigation;
