import { NotFoundError } from "../../shared/errors";
import { formatDateTime } from "../format";
import { renderMarkdown } from "../markdown";
import { errorMessage, useApi } from "../useApi";
import type { Navigate } from "../useRoute";
import { NotFound } from "./NotFound";

export const MemoScreen = ({
  notebookId,
  memoId,
  navigate,
}: {
  notebookId: string;
  memoId: string;
  navigate: Navigate;
}) => {
  const state = useApi("getMemo", { notebookId, memoId }, `${notebookId}/${memoId}`);

  if (state.kind === "error" && state.error instanceof NotFoundError) {
    return <NotFound message={state.error.message} navigate={navigate} />;
  }

  return (
    <section>
      {state.kind === "loading" && <p>読み込み中…</p>}
      {state.kind === "error" && <p role="alert">エラー: {errorMessage(state.error)}</p>}
      {state.kind === "loaded" && (
        <>
          <h2>{state.data.title || "（無題）"}</h2>
          <p>
            <small>
              更新: {formatDateTime(state.data.updatedAt)}・{state.data.updatedBy || "不明"}
            </small>
          </p>
          <article
            className="markdown"
            // renderMarkdown が DOMPurify でサニタイズ済み
            // biome-ignore lint/security/noDangerouslySetInnerHtml: サニタイズした HTML を表示するため
            dangerouslySetInnerHTML={{ __html: renderMarkdown(state.data.body) }}
          />
        </>
      )}
      <button type="button" onClick={() => navigate({ screen: "edit", notebookId, memoId })}>
        編集
      </button>{" "}
      <button type="button" onClick={() => navigate({ screen: "notebook", notebookId })}>
        メモ帳へ戻る
      </button>
    </section>
  );
};
