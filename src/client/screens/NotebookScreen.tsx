import { NotFoundError } from "../../shared/errors";
import { formatDateTime } from "../format";
import { errorMessage, useApi } from "../useApi";
import type { Navigate } from "../useRoute";
import { NotFound } from "./NotFound";

export const NotebookScreen = ({ notebookId, navigate }: { notebookId: string; navigate: Navigate }) => {
  const state = useApi("listMemos", { notebookId }, notebookId);

  if (state.kind === "error" && state.error instanceof NotFoundError) {
    return <NotFound message={state.error.message} navigate={navigate} />;
  }

  return (
    <section>
      <h2>メモ帳</h2>
      <p>この画面の URL を知っている人なら誰でも読み書きできます。共有するときは URL を伝えてください。</p>
      {state.kind === "loading" && <p>読み込み中…</p>}
      {state.kind === "error" && <p role="alert">エラー: {errorMessage(state.error)}</p>}
      {state.kind === "loaded" &&
        (state.data.length === 0 ? (
          <p>メモはまだありません。</p>
        ) : (
          <ul aria-label="メモの一覧">
            {state.data.map((memo) => (
              <li key={memo.id}>
                <button type="button" onClick={() => navigate({ screen: "memo", notebookId, memoId: memo.id })}>
                  {memo.title || "（無題）"}
                </button>{" "}
                <small>{formatDateTime(memo.updatedAt)}</small>
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
