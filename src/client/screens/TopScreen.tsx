import { useState } from "react";
import { errorMessage } from "../format";
import { callApi } from "../transport";
import type { Navigate } from "../useRoute";

export const TopScreen = ({ navigate }: { navigate: Navigate }) => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const { notebookId } = await callApi("createNotebook", undefined);
      navigate({ screen: "notebook", notebookId });
    } catch (e) {
      setError(errorMessage(e));
      setCreating(false);
    }
  };

  return (
    <section>
      <hgroup>
        <h2>使わなくなったら勝手に消えるメモ帳</h2>
        <p>メモ帳の URL を知っている人なら誰でも読み書きできます。</p>
      </hgroup>
      {error && <p role="alert">エラー: {error}</p>}
      <button type="button" onClick={create} disabled={creating} aria-busy={creating}>
        {creating ? "作成中…" : "メモ帳を作る"}
      </button>
      <p>
        <small>最後に開いてから30日たったメモ帳は、中のメモごと自動で削除されます。</small>
      </p>
    </section>
  );
};
