import type { Navigate } from "../useRoute";

export const EditScreen = ({
  notebookId,
  memoId,
  navigate,
}: {
  notebookId: string;
  memoId?: string;
  navigate: Navigate;
}) => (
  <section>
    <h2>{memoId ? "メモの編集" : "新規メモ"}</h2>
    {memoId && (
      <p>
        ID: <span data-testid="memo-id">{memoId}</span>
      </p>
    )}
    <button
      type="button"
      onClick={() => navigate(memoId ? { screen: "memo", notebookId, memoId } : { screen: "notebook", notebookId })}
    >
      キャンセル
    </button>
  </section>
);
