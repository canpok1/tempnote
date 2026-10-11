import type { Api } from "../../shared/api";
import { NotFoundError } from "../../shared/errors";
import { assertNotebookId, newNotebook, touchNotebook } from "../domain/notebook";
import type { Ports } from "./ports";

export const createUseCases = ({ notebooks, memos, clock, ids, lock }: Ports) => ({
  createNotebook: (): Api["createNotebook"]["output"] =>
    lock.run(() => {
      const notebook = newNotebook(ids.generate(), clock.now());
      notebooks.create(notebook);
      return { notebookId: notebook.id };
    }),

  listMemos: (input: Api["listMemos"]["input"]): Api["listMemos"]["output"] => {
    // 入力は通信路から来るので、型どおりとは限らない
    const notebookId = input?.notebookId;
    assertNotebookId(notebookId);
    return lock.run(() => {
      const notebook = notebooks.find(notebookId);
      if (!notebook) throw new NotFoundError("メモ帳が見つかりません");
      notebooks.update(touchNotebook(notebook, clock.now()));
      return memos.list(notebookId).map(({ id, title, updatedAt }) => ({ id, title, updatedAt }));
    });
  },
});

export type UseCases = ReturnType<typeof createUseCases>;
