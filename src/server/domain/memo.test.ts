import { describe, expect, it } from "vitest";
import { LimitExceededError, NotFoundError, ValidationError } from "../../shared/errors";
import { MAX_BODY_LENGTH, MAX_MEMOS_PER_NOTEBOOK, MAX_TITLE_LENGTH } from "../../shared/limits";
import { assertMemoId, editMemo, newMemo, validateContent } from "./memo";

const now = new Date("2026-10-11T00:00:00.000Z");
const content = { title: "買い物", body: "- 牛乳" };

describe("validateContent", () => {
  it("本文は5万文字ちょうどまで受け付ける", () => {
    expect(validateContent({ title: "", body: "あ".repeat(MAX_BODY_LENGTH) }).body).toHaveLength(MAX_BODY_LENGTH);
  });

  it("本文が5万文字を超えると LimitExceededError", () => {
    expect(() => validateContent({ title: "", body: "あ".repeat(MAX_BODY_LENGTH + 1) })).toThrow(LimitExceededError);
  });

  it("タイトルが上限を超えると LimitExceededError", () => {
    expect(() => validateContent({ title: "あ".repeat(MAX_TITLE_LENGTH + 1), body: "" })).toThrow(LimitExceededError);
  });

  it.each([{}, { title: "a" }, { title: 1, body: "" }])("文字列でない入力 %j は ValidationError", (input) => {
    expect(() => validateContent(input)).toThrow(ValidationError);
  });
});

describe("newMemo", () => {
  it("作成日時と更新日時を同じ時刻にし、更新者を記録する", () => {
    expect(newMemo("m1", content, 0, now, "a@example.com")).toEqual({
      id: "m1",
      ...content,
      createdAt: "2026-10-11T00:00:00.000Z",
      updatedAt: "2026-10-11T00:00:00.000Z",
      updatedBy: "a@example.com",
    });
  });

  it("100件目までは作れる", () => {
    expect(() => newMemo("m1", content, MAX_MEMOS_PER_NOTEBOOK - 1, now, "")).not.toThrow();
  });

  it("すでに100件あると LimitExceededError", () => {
    expect(() => newMemo("m1", content, MAX_MEMOS_PER_NOTEBOOK, now, "")).toThrow(LimitExceededError);
  });
});

describe("editMemo", () => {
  it("内容・更新日時・更新者を変え、作成日時は残す", () => {
    const memo = newMemo("m1", content, 0, now, "a@example.com");

    expect(editMemo(memo, { title: "t", body: "b" }, new Date("2026-10-12T00:00:00.000Z"), "")).toEqual({
      ...memo,
      title: "t",
      body: "b",
      updatedAt: "2026-10-12T00:00:00.000Z",
      updatedBy: "",
    });
  });
});

describe("assertMemoId", () => {
  it.each([undefined, "", "m1", "0123456789ABCDEF0123456789ABCDEF"])("%j は見つからない扱いにする", (id) => {
    expect(() => assertMemoId(id)).toThrow(NotFoundError);
  });
});
