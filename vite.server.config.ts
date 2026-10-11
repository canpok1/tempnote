// GAS で動くサーバー側コードのビルド設定。dist/gas/Code.js を出力する。
// GAS は直下に宣言された関数しか google.script.run や doGet から呼べないため、
// バンドルを変数 _tempnote に入れ、公開する関数だけ直下へ書き出すスタブを末尾に付ける。

import { defineConfig } from "vite";

const exposed = ["doGet", "api", "deleteExpiredNotebooks"];
const footer = exposed
  .map((name) => `function ${name}() { return _tempnote.${name}.apply(this, arguments); }`)
  .join("\n");

export default defineConfig({
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
