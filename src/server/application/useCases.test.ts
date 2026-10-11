import { describe, expect, it } from "vitest";
import type { Environment } from "./ports";
import { createUseCases } from "./useCases";

const fakeEnvironment: Environment = {
  name: "local",
  describeStorage: () => "テスト用の置き場所",
  currentUserEmail: () => "",
  now: () => new Date("2026-10-11T00:00:00.000Z"),
};

describe("getStatus", () => {
  it("環境から集めた情報を返す", () => {
    expect(createUseCases(fakeEnvironment).getStatus()).toEqual({
      environment: "local",
      storage: "テスト用の置き場所",
      user: "",
      serverTime: "2026-10-11T00:00:00.000Z",
    });
  });
});
