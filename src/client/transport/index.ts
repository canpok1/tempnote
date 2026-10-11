// 画面がサーバーを呼ぶ唯一の口。本番は google.script.run、ローカルは fetch を使う。
// どちらを使うかはビルド時に決まる（GAS 向けは `vite build --mode gas`）。

import type { ApiInput, ApiMethod, ApiOutput } from "../../shared/api";
import { gasTransport } from "./gas";
import { httpTransport } from "./http";

export type Transport = <M extends ApiMethod>(method: M, input: ApiInput<M>) => Promise<ApiOutput<M>>;

export const callApi: Transport = import.meta.env.MODE === "gas" ? gasTransport : httpTransport;
