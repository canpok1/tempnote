import { useEffect, useState } from "react";
import type { MemoSummary } from "../../shared/api";
import { NotFoundError } from "../../shared/errors";
import { callApi } from "../transport";
import type { Navigate } from "../useRoute";

type State =
  | { kind: "loading" }
  | { kind: "notFound" }
  | { kind: "error"; message: string }
  | { kind: "loaded"; memos: MemoSummary[] };

export const NotebookScreen = ({ notebookId, navigate }: { notebookId: string; navigate: Navigate }) => {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    callApi("listMemos", { notebookId })
      .then((memos) => active && setState({ kind: "loaded", memos }))
      .catch((e: unknown) => {
        if (!active) return;
        if (e instanceof NotFoundError) setState({ kind: "notFound" });
        else setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      active = false;
    };
  }, [notebookId]);

  if (state.kind === "notFound") {
    return (
      <section>
        <h2>メモ帳が見つかりません</h2>
        <p>URL が間違っているか、30日間開かれずに削除されたメモ帳です。</p>
        <button type="button" onClick={() => navigate({ screen: "top" })}>
          トップへ
        </button>
      </section>
    );
  }

  return (
    <section>
      <h2>メモ帳</h2>
      <p>この画面の URL を知っている人なら誰でも読み書きできます。共有するときは URL を伝えてください。</p>
      {state.kind === "loading" && <p>読み込み中…</p>}
      {state.kind === "error" && <p role="alert">エラー: {state.message}</p>}
      {state.kind === "loaded" &&
        (state.memos.length === 0 ? (
          <p>メモはまだありません。</p>
        ) : (
          <ul>
            {state.memos.map((memo) => (
              <li key={memo.id}>
                <button type="button" onClick={() => navigate({ screen: "memo", notebookId, memoId: memo.id })}>
                  {memo.title || "（無題）"}
                </button>
              </li>
            ))}
          </ul>
        ))}
      <button type="button" onClick={() => navigate({ screen: "edit", notebookId })}>
        新規メモ
      </button>{" "}
      <button type="button" onClick={() => navigate({ screen: "top" })}>
        トップへ
      </button>
    </section>
  );
};
