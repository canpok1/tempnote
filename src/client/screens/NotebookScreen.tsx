import type { Navigate } from "../useRoute";

export const NotebookScreen = ({ notebookId, navigate }: { notebookId: string; navigate: Navigate }) => (
  <section>
    <h2>メモ帳</h2>
    <p>
      ID: <span data-testid="notebook-id">{notebookId}</span>
    </p>
    <button type="button" onClick={() => navigate({ screen: "edit", notebookId })}>
      新規メモ
    </button>{" "}
    <button type="button" onClick={() => navigate({ screen: "top" })}>
      トップへ
    </button>
  </section>
);
