import { expect, type Page, test } from "@playwright/test";

const createNotebook = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("button", { name: "メモ帳を作る" }).click();
  await expect(page.getByText("メモはまだありません。")).toBeVisible();
  return new URL(page.url()).searchParams.get("id") ?? "";
};

const writeMemo = async (page: Page, title: string, body: string) => {
  await page.getByLabel("タイトル").fill(title);
  await page.getByLabel("本文（Markdown）").fill(body);
  await page.getByRole("button", { name: "保存" }).click();
};

test("メモを作って保存すると閲覧画面で Markdown が表示され、編集して保存し直せる", async ({ page }) => {
  await createNotebook(page);

  await page.getByRole("button", { name: "新規メモ" }).click();
  await writeMemo(page, "買い物", "# 見出し\n\n- 牛乳\n- 卵");

  await expect(page.getByRole("heading", { name: "買い物" })).toBeVisible();
  await expect(page.locator("article").getByRole("heading", { name: "見出し" })).toBeVisible();
  await expect(page.locator("article").getByRole("listitem")).toHaveText(["牛乳", "卵"]);
  await expect(page.getByText(/更新: .*・local-user@example\.com/)).toBeVisible();

  await page.getByRole("button", { name: "編集" }).click();
  await expect(page.getByLabel("タイトル")).toHaveValue("買い物");
  await writeMemo(page, "買い物リスト", "- パン");

  await expect(page.getByRole("heading", { name: "買い物リスト" })).toBeVisible();
  await expect(page.locator("article").getByRole("listitem")).toHaveText(["パン"]);

  await page.getByRole("button", { name: "メモ帳へ戻る" }).click();
  await expect(page.getByRole("list", { name: "メモの一覧" }).getByRole("button")).toHaveText(["買い物リスト"]);
});

test("保存した後の戻るでは編集画面に戻らない", async ({ page }) => {
  const notebookId = await createNotebook(page);

  await page.getByRole("button", { name: "新規メモ" }).click();
  await writeMemo(page, "メモ", "本文");
  await expect(page.getByRole("heading", { name: "メモ", exact: true })).toBeVisible();

  await page.goBack();

  await expect(page).toHaveURL(`/?id=${notebookId}`);
  await expect(page.getByRole("list", { name: "メモの一覧" }).getByRole("button")).toHaveText(["メモ"]);
});

test("本文に書いたスクリプトは実行されない", async ({ page }) => {
  await createNotebook(page);

  await page.getByRole("button", { name: "新規メモ" }).click();
  await writeMemo(page, "xss", '<script>window.xss = 1</script>\n\n<img src="x" onerror="window.xss = 2">\n\n本文');

  await expect(page.locator("article")).toContainText("本文");
  expect(await page.evaluate(() => (window as { xss?: number }).xss)).toBeUndefined();
});

test("キャンセルすると保存せずに戻る", async ({ page }) => {
  await createNotebook(page);

  await page.getByRole("button", { name: "新規メモ" }).click();
  await page.getByLabel("タイトル").fill("保存しない");
  await page.getByRole("button", { name: "キャンセル" }).click();

  await expect(page.getByText("メモはまだありません。")).toBeVisible();
});

test("存在しないメモは「見つかりません」と出す", async ({ page }) => {
  const notebookId = await createNotebook(page);

  await page.goto(`/?id=${notebookId}&memo=${"0".repeat(32)}`);

  await expect(page.getByRole("heading", { name: "メモが見つかりません" })).toBeVisible();
});
