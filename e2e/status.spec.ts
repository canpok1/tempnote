import { expect, test } from "@playwright/test";

test("バックエンドから取得した状態を表示する", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "tempnote" })).toBeVisible();
  await expect(page.getByTestId("environment")).toHaveText("local");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
