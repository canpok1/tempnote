// 画面がサーバーを呼ぶ唯一の口。本番は google.script.run、ローカルは fetch を使う。
// どちらを使うかはビルド時に決まる（GAS 向けは `vite build --mode gas`）。

import type { Api, ApiMethod } from "../../shared/api";
import { gasTransport } from "./gas";
import { httpTransport } from "./http";

export type Transport = <M extends ApiMethod>(method: M, input: Api[M]["input"]) => Promise<Api[M]["output"]>;

export const callApi: Transport = import.meta.env.MODE === "gas" ? gasTransport : httpTransport;
