import { describe, expect, it, vi } from "vitest";
import type { Status } from "../../shared/api";
import { ValidationError } from "../../shared/errors";
import type { UseCases } from "../application/useCases";
import { createDispatcher } from "./dispatcher";

const status: Status = { environment: "local", storage: "メモリ", user: "", serverTime: "2026-10-11T00:00:00.000Z" };

const useCasesThat = (getStatus: () => Status): UseCases => ({ getStatus });

describe("createDispatcher", () => {
  it("メソッド名に対応するユースケースの結果を成功の封筒に入れる", () => {
    const dispatch = createDispatcher(useCasesThat(() => status));

    expect(dispatch("getStatus", undefined)).toEqual({ ok: true, data: status });
  });

  it("知らないメソッド名は NOT_FOUND にする", () => {
    const dispatch = createDispatcher(useCasesThat(() => status));

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

    expect(dispatch("getStatus", undefined)).toEqual({
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

    expect(dispatch("getStatus", undefined)).toEqual({
      ok: false,
      error: { code: "INTERNAL", message: "サーバーでエラーが発生しました" },
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
