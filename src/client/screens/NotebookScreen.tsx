import { formatDateTime } from "../format";
import { useApi } from "../useApi";
import type { Navigate } from "../useRoute";
import { ApiView } from "./ApiView";

export const NotebookScreen = ({ notebookId, navigate }: { notebookId: string; navigate: Navigate }) => {
  const state = useApi("listMemos", { notebookId }, notebookId);

  return (
    <ApiView state={state} navigate={navigate}>
      {(memos) => (
        <section>
          <div className="title-row">
            <h2>メモ帳</h2>
            <button type="button" onClick={() => navigate({ screen: "edit", notebookId })}>
              新規メモ
            </button>
          </div>
          <p>
            <small>
              この画面の URL を知っている人なら誰でも読み書きできます。共有するときは URL を伝えてください。
            </small>
          </p>
          {memos.length === 0 ? (
            <p>メモはまだありません。</p>
          ) : (
            <ul aria-label="メモの一覧" className="memo-list">
              {memos.map((memo) => (
                <li key={memo.id}>
                  <button
                    type="button"
                    className={memo.title ? undefined : "untitled"}
                    onClick={() => navigate({ screen: "memo", notebookId, memoId: memo.id })}
                  >
                    {memo.title || "（無題）"}
                  </button>
                  <small>{formatDateTime(memo.updatedAt)}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </ApiView>
  );
};
