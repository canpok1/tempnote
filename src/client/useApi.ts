import { useEffect, useState } from "react";
import type { Api, ApiMethod } from "../shared/api";
import { callApi } from "./transport";

export type ApiState<T> = { kind: "loading" } | { kind: "error"; error: unknown } | { kind: "loaded"; data: T };

/**
 * 画面を開いたときにサーバーから読み込む。input が変わったら読み込み直す。
 * key は input を比べるための文字列（オブジェクトのままだと描画のたびに読み込み直してしまう）。
 */
export const useApi = <M extends ApiMethod>(method: M, input: Api[M]["input"], key: string) => {
  const [state, setState] = useState<ApiState<Api[M]["output"]>>({ kind: "loading" });

  // biome-ignore lint/correctness/useExhaustiveDependencies: input の変化は key で表す
  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    callApi(method, input)
      .then((data) => active && setState({ kind: "loaded", data }))
      .catch((error: unknown) => active && setState({ kind: "error", error }));
    return () => {
      active = false;
    };
  }, [method, key]);

  return state;
};

export const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));
