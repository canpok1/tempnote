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

test("2つの画面で同じメモを編集すると、後から保存した方に警告が出て入力が残る", async ({ page, context }) => {
  await createNotebook(page);
  await page.getByRole("button", { name: "新規メモ" }).click();
  await writeMemo(page, "共有メモ", "最初");
  await expect(page.getByRole("heading", { name: "共有メモ" })).toBeVisible();
  const memoUrl = page.url();

  const other = await context.newPage();
  await other.goto(memoUrl);
  await other.getByRole("button", { name: "編集" }).click();
  await page.getByRole("button", { name: "編集" }).click();
  await expect(page.getByLabel("タイトル")).toHaveValue("共有メモ");
  await expect(other.getByLabel("タイトル")).toHaveValue("共有メモ");

  await writeMemo(page, "共有メモ", "先に保存");
  await expect(page.locator("article")).toHaveText("先に保存");

  await writeMemo(other, "共有メモ", "後から保存");
  await expect(other.getByRole("alert")).toContainText("他の人が先にこのメモを更新しました");
  await expect(other.getByLabel("本文（Markdown）")).toHaveValue("後から保存");
  await expect(other.getByRole("button", { name: "保存" })).toBeDisabled();

  await other.getByRole("button", { name: "入力を捨てて最新のメモを開く" }).click();
  await expect(other.locator("article")).toHaveText("先に保存");
});

test("編集画面からメモを削除すると、確認の後に一覧から消える", async ({ page }) => {
  const notebookId = await createNotebook(page);
  await page.getByRole("button", { name: "新規メモ" }).click();
  await writeMemo(page, "消すメモ", "本文");
  await page.getByRole("button", { name: "編集" }).click();

  await page.getByRole("button", { name: "削除" }).click();
  await page.getByRole("button", { name: "やめる" }).click();
  await page.getByRole("button", { name: "削除" }).click();
  await page.getByRole("button", { name: "削除する" }).click();

  await expect(page).toHaveURL(`/?id=${notebookId}`);
  await expect(page.getByText("メモはまだありません。")).toBeVisible();
});
