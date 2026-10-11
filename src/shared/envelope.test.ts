import { describe, expect, it } from "vitest";
import { unwrap } from "./envelope";
import { AppError, ConflictError, type ErrorCode, LimitExceededError, NotFoundError, ValidationError } from "./errors";

describe("unwrap", () => {
  it("成功の封筒から中身を取り出す", () => {
    expect(unwrap({ ok: true, data: { value: 1 } })).toEqual({ value: 1 });
  });

  it.each<[ErrorCode, new (message: string) => AppError]>([
    ["CONFLICT", ConflictError],
    ["NOT_FOUND", NotFoundError],
    ["LIMIT_EXCEEDED", LimitExceededError],
    ["INVALID", ValidationError],
  ])("失敗の封筒のコード %s を %O に戻して投げる", (code, ErrorClass) => {
    const run = () => unwrap({ ok: false, error: { code, message: "失敗しました" } });

    expect(run).toThrow(ErrorClass);
    expect(run).toThrow(expect.objectContaining({ code, message: "失敗しました" }));
  });

  it("サブクラスの無い INTERNAL は AppError として投げる", () => {
    const run = () => unwrap({ ok: false, error: { code: "INTERNAL", message: "サーバーでエラーが発生しました" } });

    expect(run).toThrow(AppError);
    expect(run).toThrow(expect.objectContaining({ code: "INTERNAL" }));
  });
});
