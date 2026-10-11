// ユニットテストの設定。画面のビルド設定（vite.config.ts）は root が src/client なので使わず、別に持つ。
// E2E（e2e/）は Playwright で動かすため、ここでは拾わない。

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
