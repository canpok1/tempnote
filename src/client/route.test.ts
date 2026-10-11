import { describe, expect, it } from "vitest";
import { parseRoute, type Route, toParams } from "./route";

describe("parseRoute", () => {
  it.each<[Record<string, string>, Route]>([
    [{}, { screen: "top" }],
    [{ id: "" }, { screen: "top" }],
    [{ memo: "m1" }, { screen: "top" }],
    [{ id: "nb1" }, { screen: "notebook", notebookId: "nb1" }],
    [
      { id: "nb1", memo: "m1" },
      { screen: "memo", notebookId: "nb1", memoId: "m1" },
    ],
    [
      { id: "nb1", memo: "m1", mode: "edit" },
      { screen: "edit", notebookId: "nb1", memoId: "m1" },
    ],
    [
      { id: "nb1", mode: "edit" },
      { screen: "edit", notebookId: "nb1" },
    ],
    [
      { id: "nb1", memo: "m1", mode: "unknown" },
      { screen: "memo", notebookId: "nb1", memoId: "m1" },
    ],
  ])("%j は %j", (params, route) => {
    expect(parseRoute(params)).toEqual(route);
  });
});

describe("toParams", () => {
  it.each<Route>([
    { screen: "top" },
    { screen: "notebook", notebookId: "nb1" },
    { screen: "memo", notebookId: "nb1", memoId: "m1" },
    { screen: "edit", notebookId: "nb1", memoId: "m1" },
    { screen: "edit", notebookId: "nb1" },
  ])("%j は読み戻すと同じ画面になる", (route) => {
    expect(parseRoute(toParams(route))).toEqual(route);
  });

  it("空の値のパラメータを作らない", () => {
    expect(toParams({ screen: "edit", notebookId: "nb1" })).toEqual({ id: "nb1", mode: "edit" });
  });
});
