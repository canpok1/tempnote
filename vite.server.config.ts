// GAS で動くサーバー側コードのビルド設定。dist/gas/Code.js を出力する。
// GAS は直下に宣言された関数しか google.script.run や doGet から呼べないため、
// バンドルを変数 _tempnote に入れ、公開する関数だけ直下へ書き出すスタブを末尾に付ける。

import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const exposed = ["doGet", "api", "deleteExpiredNotebooks"];
const footer = exposed
  .map((name) => `function ${name}() { return _tempnote.${name}.apply(this, arguments); }`)
  .join("\n");

/**
 * ファビコンの URL。GAS は画面の HTML に書いたファビコンを無視し、setFaviconUrl に画像の URL を渡すしかないため、
 * リポジトリに置いた assets/favicon.png を GitHub から配る（docs/adr/0002）。
 * GitHub Actions では自分のリポジトリ、手元では package.json の repository を指す。FAVICON_URL で上書きできる。
 */
const faviconUrl = () => {
  if (process.env.FAVICON_URL) return process.env.FAVICON_URL;
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const repo =
    process.env.GITHUB_REPOSITORY ?? pkg.repository?.url?.match(/github\.com\/([^/]+\/[^/]+?)(\.git)?$/)?.[1];
  if (!repo) throw new Error("ファビコンの配信元が決められません。FAVICON_URL を指定してください");
  return `https://raw.githubusercontent.com/${repo}/main/assets/favicon.png`;
};

export default defineConfig({
  define: {
    __FAVICON_URL__: JSON.stringify(faviconUrl()),
  },
  build: {
    outDir: "dist/gas",
    emptyOutDir: false,
    minify: false,
    target: "es2019",
    lib: {
      entry: "src/server/entry/gas.ts",
      formats: ["iife"],
      name: "_tempnote",
      fileName: () => "Code.js",
    },
    rollupOptions: {
      output: { footer },
    },
  },
});
