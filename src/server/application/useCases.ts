import type { Api } from "../../shared/api";
import { NotFoundError } from "../../shared/errors";
import { assertMemoId, editMemo, newMemo, validateContent } from "../domain/memo";
import { assertNotebookId, type Notebook, newNotebook, touchNotebook } from "../domain/notebook";
import type { Ports } from "./ports";

type Input<M extends keyof Api> = Api[M]["input"];
type Output<M extends keyof Api> = Api[M]["output"];

export const createUseCases = ({ notebooks, memos, clock, user, ids, lock }: Ports) => {
  /** メモ帳を開いた扱いにして最終アクセス日時を進める。無ければ NotFoundError。ロックの中で呼ぶ */
  const openNotebook = (notebookId: string): Notebook => {
    const notebook = notebooks.find(notebookId);
    if (!notebook) throw new NotFoundError("メモ帳が見つかりません");
    const touched = touchNotebook(notebook, clock.now());
    notebooks.update(touched);
    return touched;
  };

  return {
    createNotebook: (): Output<"createNotebook"> =>
      lock.run(() => {
        const notebook = newNotebook(ids.generate(), clock.now());
        notebooks.create(notebook);
        return { notebookId: notebook.id };
      }),

    // 入力は通信路から来るので、型どおりとは限らない。形を確かめてからロックを取る
    listMemos: (input: Input<"listMemos">): Output<"listMemos"> => {
      const notebookId = input?.notebookId;
      assertNotebookId(notebookId);
      return lock.run(() => {
        openNotebook(notebookId);
        return memos.list(notebookId).map(({ id, title, updatedAt }) => ({ id, title, updatedAt }));
      });
    },

    getMemo: (input: Input<"getMemo">): Output<"getMemo"> => {
      const { notebookId, memoId } = input ?? {};
      assertNotebookId(notebookId);
      assertMemoId(memoId);
      return lock.run(() => {
        openNotebook(notebookId);
        const memo = memos.find(notebookId, memoId);
        if (!memo) throw new NotFoundError("メモが見つかりません");
        return memo;
      });
    },

    saveMemo: (input: Input<"saveMemo">): Output<"saveMemo"> => {
      const notebookId = input?.notebookId;
      // 通信路によっては省略した値が null や空文字で届くので、どれも「新規」として扱う
      const memoId = input?.memoId || undefined;
      assertNotebookId(notebookId);
      if (memoId !== undefined) assertMemoId(memoId);
      const content = validateContent(input);
      return lock.run(() => {
        openNotebook(notebookId);
        const now = clock.now();
        let memo: Output<"saveMemo">;
        if (memoId === undefined) {
          memo = newMemo(ids.generate(), content, memos.list(notebookId).length, now, user.email());
        } else {
          const current = memos.find(notebookId, memoId);
          if (!current) throw new NotFoundError("メモが見つかりません");
          memo = editMemo(current, content, now, user.email());
        }
        memos.save(notebookId, memo);
        return memo;
      });
    },
  };
};

export type UseCases = ReturnType<typeof createUseCases>;
