import { formatDateTime } from "../format";
import { MarkdownView } from "../MarkdownView";
import { useApi } from "../useApi";
import type { Navigate } from "../useRoute";
import { ApiView } from "./ApiView";

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

  return (
    <ApiView state={state} navigate={navigate}>
      {(memo) => (
        <section>
          <div className="title-row">
            <h2>{memo.title || "（無題）"}</h2>
            <button type="button" onClick={() => navigate({ screen: "edit", notebookId, memoId })}>
              編集
            </button>
          </div>
          <p>
            <small>
              更新: {formatDateTime(memo.updatedAt)}・{memo.updatedBy || "不明"}
            </small>
          </p>
          <MarkdownView markdown={memo.body} />
          <button
            type="button"
            className="outline secondary"
            onClick={() => navigate({ screen: "notebook", notebookId })}
          >
            メモ帳へ戻る
          </button>
        </section>
      )}
    </ApiView>
  );
};
