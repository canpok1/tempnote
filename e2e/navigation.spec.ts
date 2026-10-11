import { expect, type Page, test } from "@playwright/test";

const createNotebook = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("button", { name: "メモ帳を作る" }).click();
  await expect(page.getByRole("heading", { name: "メモ帳", exact: true })).toBeVisible();
  return new URL(page.url()).searchParams.get("id") ?? "";
};

test("メモ帳を作るとメモ帳画面へ移り、トップへ出てから戻るで元のメモ帳に戻る", async ({ page }) => {
  const notebookId = await createNotebook(page);

  expect(notebookId).toMatch(/^[0-9a-f]{32}$/);
  await expect(page.getByText("メモはまだありません。")).toBeVisible();

  // 上部のバーのアプリ名でトップへ出る
  await page.getByRole("button", { name: "tempnote" }).click();
  await expect(page.getByRole("button", { name: "メモ帳を作る" })).toBeVisible();
  await expect(page).toHaveURL("/");

  await page.goBack();
  await expect(page.getByRole("heading", { name: "メモ帳", exact: true })).toBeVisible();
  await expect(page).toHaveURL(`/?id=${notebookId}`);

  await page.goForward();
  await expect(page.getByRole("button", { name: "メモ帳を作る" })).toBeVisible();
});

test("作ったメモ帳は URL を直接開いても表示できる", async ({ page }) => {
  const notebookId = await createNotebook(page);

  await page.goto(`/?id=${notebookId}`);

  await expect(page.getByText("メモはまだありません。")).toBeVisible();
});

for (const id of ["0".repeat(32), "not-a-notebook-id"]) {
  test(`存在しないメモ帳 ${id} は「見つかりません」と出す`, async ({ page }) => {
    await page.goto(`/?id=${id}`);

    await expect(page.getByRole("heading", { name: "メモ帳が見つかりません" })).toBeVisible();
    await page.getByRole("button", { name: "トップへ" }).click();
    await expect(page.getByRole("button", { name: "メモ帳を作る" })).toBeVisible();
  });
}

test("メモ帳から新規メモの編集画面へ移る", async ({ page }) => {
  const notebookId = await createNotebook(page);

  await page.getByRole("button", { name: "新規メモ" }).click();

  await expect(page.getByRole("heading", { name: "新規メモ" })).toBeVisible();
  await expect(page).toHaveURL(`/?id=${notebookId}&mode=edit`);
});

test("道しるべのメモ帳を押すと、編集画面からメモ帳へ戻る", async ({ page }) => {
  const notebookId = await createNotebook(page);
  await page.getByRole("button", { name: "新規メモ" }).click();

  const crumbs = page.getByRole("list", { name: "現在地" });
  await expect(crumbs.getByRole("listitem")).toHaveText(["メモ帳", "新規メモ"]);
  await crumbs.getByRole("button", { name: "メモ帳" }).click();

  await expect(page).toHaveURL(`/?id=${notebookId}`);
  await expect(page.getByRole("heading", { name: "メモ帳", exact: true })).toBeVisible();
});
