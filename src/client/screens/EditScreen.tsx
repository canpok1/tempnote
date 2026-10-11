import { useState } from "react";
import type { Memo } from "../../shared/api";
import { ConflictError, NotFoundError } from "../../shared/errors";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "../../shared/limits";
import { callApi } from "../transport";
import { errorMessage, useApi } from "../useApi";
import type { Navigate } from "../useRoute";
import { NotFound } from "./NotFound";

type Props = { notebookId: string; memoId?: string; navigate: Navigate };

export const EditScreen = ({ notebookId, memoId, navigate }: Props) =>
  memoId ? (
    <LoadAndEdit notebookId={notebookId} memoId={memoId} navigate={navigate} />
  ) : (
    <Editor notebookId={notebookId} navigate={navigate} />
  );

const LoadAndEdit = ({ notebookId, memoId, navigate }: Props & { memoId: string }) => {
  const state = useApi("getMemo", { notebookId, memoId }, `${notebookId}/${memoId}`);

  if (state.kind === "loading") return <p>読み込み中…</p>;
  if (state.kind === "error") {
    if (state.error instanceof NotFoundError) return <NotFound message={state.error.message} navigate={navigate} />;
    return <p role="alert">エラー: {errorMessage(state.error)}</p>;
  }
  return <Editor notebookId={notebookId} memo={state.data} navigate={navigate} />;
};

const Editor = ({ notebookId, memo, navigate }: { notebookId: string; memo?: Memo; navigate: Navigate }) => {
  const [title, setTitle] = useState(memo?.title ?? "");
  const [body, setBody] = useState(memo?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicted, setConflicted] = useState(false);

  const back = () =>
    navigate(memo ? { screen: "memo", notebookId, memoId: memo.id } : { screen: "notebook", notebookId });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await callApi("saveMemo", {
        notebookId,
        memoId: memo?.id,
        title,
        body,
        baseUpdatedAt: memo?.updatedAt,
      });
      // 戻るで編集画面に戻ると、同じ内容でもう一度保存できてしまうので履歴を置き換える
      navigate({ screen: "memo", notebookId, memoId: saved.id }, { replace: true });
    } catch (e) {
      // 入力はそのまま残して、控えたり直したりできるようにする
      fail(e);
    }
  };

  const remove = async () => {
    if (!memo) return;
    setSaving(true);
    setError(null);
    try {
      await callApi("deleteMemo", { notebookId, memoId: memo.id, baseUpdatedAt: memo.updatedAt });
      // 削除したメモの画面へ戻るで戻れないように、履歴を置き換える
      navigate({ screen: "notebook", notebookId }, { replace: true });
    } catch (e) {
      fail(e);
    }
  };

  const fail = (e: unknown) => {
    setError(errorMessage(e));
    setConflicted(e instanceof ConflictError);
    setConfirmingDelete(false);
    setSaving(false);
  };

  return (
    <section>
      <h2>{memo ? "メモの編集" : "新規メモ"}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <p>
          <label>
            タイトル
            <br />
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={MAX_TITLE_LENGTH} />
          </label>
        </p>
        <p>
          <label>
            本文（Markdown）
            <br />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={16} />
          </label>
          <br />
          <small>
            {body.length.toLocaleString()} / {MAX_BODY_LENGTH.toLocaleString()} 文字
          </small>
        </p>
        {error && (
          <div role="alert">
            <p>{conflicted ? error : `保存できませんでした: ${error}`}</p>
            {conflicted && memo && (
              <p>
                <button type="button" onClick={back}>
                  入力を捨てて最新のメモを開く
                </button>
              </p>
            )}
          </div>
        )}
        <button type="submit" disabled={saving || conflicted}>
          {saving ? "保存中…" : "保存"}
        </button>{" "}
        <button type="button" onClick={back} disabled={saving}>
          キャンセル
        </button>
        {memo && !confirmingDelete && (
          <>
            {" "}
            <button type="button" onClick={() => setConfirmingDelete(true)} disabled={saving || conflicted}>
              削除
            </button>
          </>
        )}
        {memo && confirmingDelete && (
          <p>
            このメモを削除します。元に戻せません。{" "}
            <button type="button" onClick={remove} disabled={saving}>
              削除する
            </button>{" "}
            <button type="button" onClick={() => setConfirmingDelete(false)} disabled={saving}>
              やめる
            </button>
          </p>
        )}
      </form>
    </section>
  );
};
