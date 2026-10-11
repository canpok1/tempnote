import { EditScreen } from "./screens/EditScreen";
import { MemoScreen } from "./screens/MemoScreen";
import { NotebookScreen } from "./screens/NotebookScreen";
import { TopScreen } from "./screens/TopScreen";
import { useRoute } from "./useRoute";

export const App = () => {
  const { route, navigate } = useRoute();

  return (
    <main>
      <h1>tempnote</h1>
      {!route && <p>読み込み中…</p>}
      {route?.screen === "top" && <TopScreen navigate={navigate} />}
      {route?.screen === "notebook" && <NotebookScreen notebookId={route.notebookId} navigate={navigate} />}
      {route?.screen === "memo" && (
        <MemoScreen notebookId={route.notebookId} memoId={route.memoId} navigate={navigate} />
      )}
      {route?.screen === "edit" && (
        <EditScreen notebookId={route.notebookId} memoId={route.memoId} navigate={navigate} />
      )}
    </main>
  );
};
