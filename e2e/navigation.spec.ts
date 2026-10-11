import { expect, test } from "@playwright/test";

test("?id= でメモ帳画面が出て、移った先から戻るで元の画面に戻る", async ({ page }) => {
  await page.goto("/?id=nb1");

  await expect(page.getByRole("heading", { name: "メモ帳" })).toBeVisible();
  await expect(page.getByTestId("notebook-id")).toHaveText("nb1");

  await page.getByRole("button", { name: "トップへ" }).click();
  await expect(page.getByRole("heading", { name: "トップ" })).toBeVisible();
  await expect(page).toHaveURL("/");

  await page.goBack();
  await expect(page.getByRole("heading", { name: "メモ帳" })).toBeVisible();
  await expect(page.getByTestId("notebook-id")).toHaveText("nb1");

  await page.goForward();
  await expect(page.getByRole("heading", { name: "トップ" })).toBeVisible();
});

test("メモの閲覧から編集へ移り、戻るで閲覧に戻る", async ({ page }) => {
  await page.goto("/?id=nb1&memo=m1");
  await expect(page.getByRole("heading", { name: "メモ", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "編集" }).click();
  await expect(page.getByRole("heading", { name: "メモの編集" })).toBeVisible();
  await expect(page).toHaveURL("/?id=nb1&memo=m1&mode=edit");

  await page.goBack();
  await expect(page.getByRole("heading", { name: "メモ", exact: true })).toBeVisible();
  await expect(page.getByTestId("memo-id")).toHaveText("m1");
});

test("メモ帳から新規メモの編集画面へ移る", async ({ page }) => {
  await page.goto("/?id=nb1");

  await page.getByRole("button", { name: "新規メモ" }).click();

  await expect(page.getByRole("heading", { name: "新規メモ" })).toBeVisible();
  await expect(page).toHaveURL("/?id=nb1&mode=edit");
});
