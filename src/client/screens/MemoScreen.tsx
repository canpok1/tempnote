import type { Navigate } from "../useRoute";

export const MemoScreen = ({
  notebookId,
  memoId,
  navigate,
}: {
  notebookId: string;
  memoId: string;
  navigate: Navigate;
}) => (
  <section>
    <h2>メモ</h2>
    <p>
      ID: <span data-testid="memo-id">{memoId}</span>
    </p>
    <button type="button" onClick={() => navigate({ screen: "edit", notebookId, memoId })}>
      編集
    </button>{" "}
    <button type="button" onClick={() => navigate({ screen: "notebook", notebookId })}>
      メモ帳へ戻る
    </button>
  </section>
);
