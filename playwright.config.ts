// E2E テストの設定。ローカルの開発サーバー（npm run dev）を立ち上げ、ブラウザから画面を操作する。
// GAS には接続しない。

import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    // 手元で npm run dev を起動済みなら、それを使う
    reuseExistingServer: !isCI,
  },
});
