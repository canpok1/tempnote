// URL のパラメータと画面の対応。URL は `?id=<メモ帳ID>`、メモは `&memo=<メモID>`、編集は `&mode=edit` で表す。

import type { Params } from "./navigation";

export type Route =
  | { screen: "top" }
  | { screen: "notebook"; notebookId: string }
  | { screen: "memo"; notebookId: string; memoId: string }
  /** memoId が無いときは新規メモの編集 */
  | { screen: "edit"; notebookId: string; memoId?: string };

export const parseRoute = (params: Params): Route => {
  const notebookId = params.id;
  if (!notebookId) return { screen: "top" };
  const memoId = params.memo || undefined;
  if (params.mode === "edit") return memoId ? { screen: "edit", notebookId, memoId } : { screen: "edit", notebookId };
  if (memoId) return { screen: "memo", notebookId, memoId };
  return { screen: "notebook", notebookId };
};

export const toParams = (route: Route): Params => {
  switch (route.screen) {
    case "top":
      return {};
    case "notebook":
      return { id: route.notebookId };
    case "memo":
      return { id: route.notebookId, memo: route.memoId };
    case "edit":
      return route.memoId
        ? { id: route.notebookId, memo: route.memoId, mode: "edit" }
        : { id: route.notebookId, mode: "edit" };
  }
};
