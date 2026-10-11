import { expect, type Page, test } from "@playwright/test";

// 開発サーバーの時計を進め、GAS の時間トリガーが1日1回呼ぶ処理を今すぐ実行する（vite.config.ts の /__dev）
const advanceDays = async (page: Page, days: number) => {
  const res = await page.request.post("/__dev/advance-clock", { data: { days } });
  expect(res.ok()).toBe(true);
};
const runDailyJob = async (page: Page) => {
  const res = await page.request.post("/__dev/delete-expired");
  expect(res.ok()).toBe(true);
};
// GAS 版で settings シートを書き換えるのにあたる。null で既定値に戻す
const setExpiryDays = async (page: Page, days: string | null) => {
  const res = await page.request.post("/__dev/settings", { data: { expiryDays: days } });
  expect(res.ok()).toBe(true);
};

test.afterEach(async ({ page }) => {
  await setExpiryDays(page, null);
});

test("最後に開いてから30日たったメモ帳は日次の処理で消え、開くと「見つかりません」になる", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "メモ帳を作る" }).click();
  await expect(page.getByText("メモはまだありません。")).toBeVisible();
  const notebookUrl = page.url();

  // 29日後に開くと最終アクセス日時が進むので、作ってから31日たっても消えない
  await advanceDays(page, 29);
  await runDailyJob(page);
  await page.goto(notebookUrl);
  await expect(page.getByText("メモはまだありません。")).toBeVisible();

  await advanceDays(page, 2);
  await runDailyJob(page);
  await page.goto(notebookUrl);
  await expect(page.getByText("メモはまだありません。")).toBeVisible();

  // 最後に開いてから30日たつと消える
  await advanceDays(page, 30);
  await runDailyJob(page);
  await page.goto(notebookUrl);
  await expect(page.getByRole("heading", { name: "メモ帳が見つかりません" })).toBeVisible();
});

test("設定 expiryDays を変えると、その日数で消える", async ({ page }) => {
  await setExpiryDays(page, "7");
  await page.goto("/");
  await page.getByRole("button", { name: "メモ帳を作る" }).click();
  await expect(page.getByText("メモはまだありません。")).toBeVisible();
  const notebookUrl = page.url();

  await advanceDays(page, 7);
  await runDailyJob(page);
  await page.goto(notebookUrl);
  await expect(page.getByRole("heading", { name: "メモ帳が見つかりません" })).toBeVisible();
});
