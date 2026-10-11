import type { ReactNode } from "react";
import { NotFoundError } from "../../shared/errors";
import { errorMessage } from "../format";
import type { ApiState } from "../useApi";
import type { Navigate } from "../useRoute";
import { NotFound } from "./NotFound";

/** useApi の結果で画面を出し分ける。読み込めたときだけ children を描き、それ以外は読み込み中・エラー・見つからない画面にする */
export const ApiView = <T,>({
  state,
  navigate,
  children,
}: {
  state: ApiState<T>;
  navigate: Navigate;
  children: (data: T) => ReactNode;
}) => {
  if (state.kind === "loading") return <p aria-busy="true">読み込み中…</p>;
  if (state.kind === "error") {
    if (state.error instanceof NotFoundError) return <NotFound message={state.error.message} navigate={navigate} />;
    return <p role="alert">エラー: {errorMessage(state.error)}</p>;
  }
  return children(state.data);
};
