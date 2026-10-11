import { useEffect, useState } from "react";
import type { Status } from "../shared/api";
import { callApi } from "./transport";

export const App = () => {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callApi("getStatus", undefined)
      .then(setStatus)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>tempnote</h1>
      {error && <p role="alert">エラー: {error}</p>}
      {!status && !error && <p>読み込み中…</p>}
      {status && (
        <dl>
          <dt>環境</dt>
          <dd data-testid="environment">{status.environment}</dd>
          <dt>データの置き場所</dt>
          <dd>{status.storage}</dd>
          <dt>利用者</dt>
          <dd>{status.user || "不明"}</dd>
          <dt>サーバー時刻</dt>
          <dd>{status.serverTime}</dd>
        </dl>
      )}
    </main>
  );
};
