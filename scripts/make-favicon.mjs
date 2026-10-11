// ロゴの SVG（src/client/logo.svg）から、ファビコン用の PNG（assets/favicon.png）を書き出す。
// GAS のファビコンは外部の画像 URL でしか付けられないため、PNG をリポジトリに置いて GitHub から配る（docs/adr/0002）。
// ロゴを変えたら `npm run favicon` で作り直してコミットする。

import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const SIZE = 128;
const svg = readFileSync("src/client/logo.svg", "utf8");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
await page.setContent(
  `<style>html,body{margin:0;background:transparent}svg{display:block;width:${SIZE}px;height:${SIZE}px}</style>${svg}`,
);
await page.screenshot({ path: "assets/favicon.png", omitBackground: true });
await browser.close();
console.log(`assets/favicon.png: ${SIZE}x${SIZE}`);
