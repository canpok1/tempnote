import type { Route } from "./route";
import { EditScreen } from "./screens/EditScreen";
import { MemoScreen } from "./screens/MemoScreen";
import { NotebookScreen } from "./screens/NotebookScreen";
import { TopScreen } from "./screens/TopScreen";
import { type Navigate, useRoute } from "./useRoute";

export const App = () => {
  const { route, navigate } = useRoute();

  return (
    <>
      <Header route={route} navigate={navigate} />
      <main>
        {!route && <p aria-busy="true">読み込み中…</p>}
        {route?.screen === "top" && <TopScreen navigate={navigate} />}
        {route?.screen === "notebook" && <NotebookScreen notebookId={route.notebookId} navigate={navigate} />}
        {route?.screen === "memo" && (
          <MemoScreen notebookId={route.notebookId} memoId={route.memoId} navigate={navigate} />
        )}
        {route?.screen === "edit" && (
          <EditScreen notebookId={route.notebookId} memoId={route.memoId} navigate={navigate} />
        )}
      </main>
    </>
  );
};

/** 全画面に共通のバー。アプリ名でトップへ戻り、メモ帳の中では今いる場所を道しるべで示す */
const Header = ({ route, navigate }: { route: Route | null; navigate: Navigate }) => (
  <header className="app-bar">
    <nav>
      <ul>
        <li>
          <button type="button" className="brand" onClick={() => navigate({ screen: "top" })}>
            tempnote
          </button>
        </li>
      </ul>
      {route && route.screen !== "top" && (
        <ul aria-label="現在地" className="crumbs">
          {crumbs(route).map(({ label, to }) => (
            <li key={label}>
              {to ? (
                <button type="button" className="crumb" onClick={() => navigate(to)}>
                  {label}
                </button>
              ) : (
                <span aria-current="page">{label}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </nav>
  </header>
);

/** 道しるべの各段。to があるものは押すとその画面へ移る。最後の段が今の画面 */
const crumbs = (route: Exclude<Route, { screen: "top" }>): { label: string; to?: Route }[] => {
  const notebook: Route = { screen: "notebook", notebookId: route.notebookId };
  switch (route.screen) {
    case "notebook":
      return [{ label: "メモ帳" }];
    case "memo":
      return [{ label: "メモ帳", to: notebook }, { label: "メモ" }];
    case "edit":
      return route.memoId
        ? [
            { label: "メモ帳", to: notebook },
            { label: "メモ", to: { screen: "memo", notebookId: route.notebookId, memoId: route.memoId } },
            { label: "編集" },
          ]
        : [{ label: "メモ帳", to: notebook }, { label: "新規メモ" }];
  }
};
