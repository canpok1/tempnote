// メソッド名からユースケースへ振り分け、例外を通信用の封筒に詰め替える。
// GAS の入口とローカルの入口が共通で使う。

import type { Api, ApiMethod } from "../../shared/api";
import type { Envelope } from "../../shared/envelope";
import { AppError, NotFoundError } from "../../shared/errors";
import type { UseCases } from "../application/useCases";

const routes = (useCases: UseCases): Record<ApiMethod, (input: unknown) => unknown> => ({
  createNotebook: () => useCases.createNotebook(),
  listMemos: (input) => useCases.listMemos(input as Api["listMemos"]["input"]),
});

export const createDispatcher = (useCases: UseCases) => {
  const table = routes(useCases);
  return (method: string, input: unknown): Envelope => {
    try {
      const handler = table[method as ApiMethod];
      if (!handler) throw new NotFoundError(`unknown method: ${method}`);
      return { ok: true, data: handler(input) };
    } catch (e) {
      if (e instanceof AppError) return { ok: false, error: { code: e.code, message: e.message } };
      console.error(e);
      return { ok: false, error: { code: "INTERNAL", message: "サーバーでエラーが発生しました" } };
    }
  };
};
