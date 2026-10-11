import { useDeferredValue, useState } from "react";
import type { Memo } from "../../shared/api";
import { ConflictError } from "../../shared/errors";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "../../shared/limits";
import { errorMessage } from "../format";
import { MarkdownView } from "../MarkdownView";
import { callApi } from "../transport";
import { useApi } from "../useApi";
import type { Navigate } from "../useRoute";
import { ApiView } from "./ApiView";

type Props = { notebookId: string; memoId?: string; navigate: Navigate };

export const EditScreen = ({ notebookId, memoId, navigate }: Props) =>
  memoId ? (
    <LoadAndEdit notebookId={notebookId} memoId={memoId} navigate={navigate} />
  ) : (
    <Editor notebookId={notebookId} navigate={navigate} />
  );

const LoadAndEdit = ({ notebookId, memoId, navigate }: Props & { memoId: string }) => {
  const state = useApi("getMemo", { notebookId, memoId }, `${notebookId}/${memoId}`);

  return (
    <ApiView state={state} navigate={navigate}>
      {(memo) => <Editor notebookId={notebookId} memo={memo} navigate={navigate} />}
    </ApiView>
  );
};

const Editor = ({ notebookId, memo, navigate }: { notebookId: string; memo?: Memo; navigate: Navigate }) => {
  const [title, setTitle] = useState(memo?.title ?? "");
  const [body, setBody] = useState(memo?.body ?? "");
  // 長い本文でも入力が引っかからないよう、プレビューの描き直しは入力より後回しにする
  const previewBody = useDeferredValue(body);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicted, setConflicted] = useState(false);

  const back = () =>
    navigate(memo ? { screen: "memo", notebookId, memoId: memo.id } : { screen: "notebook", notebookId });

  /** 保存・削除を送る。失敗しても入力はそのまま残して、控えたり直したりできるようにする */
  const submit = async (task: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(errorMessage(e));
      setConflicted(e instanceof ConflictError);
      setConfirmingDelete(false);
      setSaving(false);
    }
  };

  const save = () =>
    submit(async () => {
      const saved = await callApi("saveMemo", {
        notebookId,
        memoId: memo?.id,
        title,
        body,
        baseUpdatedAt: memo?.updatedAt,
      });
      // 戻るで編集画面に戻ると、同じ内容でもう一度保存できてしまうので履歴を置き換える
      navigate({ screen: "memo", notebookId, memoId: saved.id }, { replace: true });
    });

  const remove = (target: Memo) =>
    submit(async () => {
      await callApi("deleteMemo", { notebookId, memoId: target.id, baseUpdatedAt: target.updatedAt });
      // 削除したメモの画面へ戻るで戻れないように、履歴を置き換える
      navigate({ screen: "notebook", notebookId }, { replace: true });
    });

  return (
    <section>
      <h2>{memo ? "メモの編集" : "新規メモ"}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label>
          タイトル
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={MAX_TITLE_LENGTH} />
        </label>
        <div className="editor">
          <label>
            本文（Markdown）
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={16} />
            <small>
              {body.length.toLocaleString()} / {MAX_BODY_LENGTH.toLocaleString()} 文字
            </small>
          </label>
          <div className="preview">
            プレビュー
            <MarkdownView markdown={previewBody} label="プレビュー" />
          </div>
        </div>
        {error && (
          <div role="alert">
            <p>{conflicted ? error : `保存できませんでした: ${error}`}</p>
            {conflicted && memo && (
              <button type="button" onClick={back}>
                入力を捨てて最新のメモを開く
              </button>
            )}
          </div>
        )}
        {memo && confirmingDelete ? (
          <div className="actions" key="confirm-delete">
            <span>このメモを削除します。元に戻せません。</span>
            <button type="button" className="danger" onClick={() => remove(memo)} disabled={saving} aria-busy={saving}>
              削除する
            </button>
            <button
              type="button"
              className="outline secondary"
              onClick={() => setConfirmingDelete(false)}
              disabled={saving}
            >
              やめる
            </button>
          </div>
        ) : (
          // 確認の前後でボタンの DOM を使い回すと、保存ボタンの色が削除ボタンへ遷移して見えるので key で分ける
          <div className="actions" key="edit">
            <button type="submit" disabled={saving || conflicted} aria-busy={saving}>
              {saving ? "保存中…" : "保存"}
            </button>
            <button type="button" className="outline secondary" onClick={back} disabled={saving}>
              キャンセル
            </button>
            {memo && (
              <button
                type="button"
                className="outline danger push-end"
                onClick={() => setConfirmingDelete(true)}
                disabled={saving || conflicted}
              >
                削除
              </button>
            )}
          </div>
        )}
      </form>
    </section>
  );
};
