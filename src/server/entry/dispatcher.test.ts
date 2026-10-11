import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "../../shared/errors";
import type { UseCases } from "../application/useCases";
import { createDispatcher } from "./dispatcher";

const created = { notebookId: "0123456789abcdef0123456789abcdef" };

const useCasesThat = (createNotebook: UseCases["createNotebook"]): UseCases => ({
  createNotebook,
  listMemos: () => [],
});

describe("createDispatcher", () => {
  it("メソッド名に対応するユースケースの結果を成功の封筒に入れる", () => {
    const dispatch = createDispatcher(useCasesThat(() => created));

    expect(dispatch("createNotebook", undefined)).toEqual({ ok: true, data: created });
  });

  it("知らないメソッド名は NOT_FOUND にする", () => {
    const dispatch = createDispatcher(useCasesThat(() => created));

    expect(dispatch("unknown", undefined)).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "unknown method: unknown" },
    });
  });

  it("AppError のサブクラスはコードとメッセージをそのまま封筒に詰める", () => {
    const dispatch = createDispatcher(
      useCasesThat(() => {
        throw new ValidationError("入力が不正です");
      }),
    );

    expect(dispatch("createNotebook", undefined)).toEqual({
      ok: false,
      error: { code: "INVALID", message: "入力が不正です" },
    });
  });

  it("想定外の例外は中身を隠して INTERNAL にする", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const dispatch = createDispatcher(
      useCasesThat(() => {
        throw new Error("secret detail");
      }),
    );

    expect(dispatch("createNotebook", undefined)).toEqual({
      ok: false,
      error: { code: "INTERNAL", message: "サーバーでエラーが発生しました" },
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
