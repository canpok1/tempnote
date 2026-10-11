import { useState } from "react";
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
      setError(e instanceof Error ? e.message : String(e));
      setCreating(false);
    }
  };

  return (
    <section>
      <p>使わなくなったら勝手に消えるメモ帳です。メモ帳の URL を知っている人なら誰でも読み書きできます。</p>
      <p>最後に開いてから30日たったメモ帳は、中のメモごと自動で削除されます。</p>
      {error && <p role="alert">エラー: {error}</p>}
      <button type="button" onClick={create} disabled={creating}>
        {creating ? "作成中…" : "メモ帳を作る"}
      </button>
    </section>
  );
};
