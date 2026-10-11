import { describe, expect, it } from "vitest";
import { unwrap } from "./envelope";
import { AppError } from "./errors";

describe("unwrap", () => {
  it("成功の封筒から中身を取り出す", () => {
    expect(unwrap({ ok: true, data: { value: 1 } })).toEqual({ value: 1 });
  });

  it("失敗の封筒を AppError に戻して投げる", () => {
    const run = () => unwrap({ ok: false, error: { code: "NOT_FOUND", message: "見つかりません" } });

    expect(run).toThrow(AppError);
    expect(run).toThrow(expect.objectContaining({ code: "NOT_FOUND", message: "見つかりません" }));
  });
});
