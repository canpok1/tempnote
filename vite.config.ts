// フロントのビルドとローカル開発サーバーの設定。
// - `vite`（npm run dev）: 画面に加え、/api でローカル用のバックエンドを動かす
// - `vite build --mode gas`: GAS で配信する HTML 1枚を dist/gas/index.html に出力する

import type { IncomingMessage } from "node:http";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const readBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : undefined;
};

const localEntry = resolve(import.meta.dirname, "src/server/entry/local.ts");

/** 開発サーバーに /api/:method を足し、本番と同じ dispatcher をローカル実装で動かす */
const localApi = (): Plugin => ({
  name: "tempnote-local-api",
  configureServer(server) {
    server.middlewares.use("/api", async (req, res, next) => {
      try {
        const method = (req.url ?? "").replace(/^\//, "").split("?")[0];
        // 毎回読み込み直すので、サーバー側のコードを変えても再起動は要らない
        const { dispatch } = await server.ssrLoadModule(localEntry);
        const envelope = dispatch(method, (await readBody(req)) ?? undefined);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(envelope));
      } catch (e) {
        next(e);
      }
    });
  },
});

export default defineConfig(({ mode }) => ({
  root: "src/client",
  plugins: [react(), mode === "gas" ? viteSingleFile() : localApi()],
  build: {
    outDir: "../../dist/gas",
    emptyOutDir: false,
    // GAS では1ファイルに埋め込むので、分割読み込み用のポリフィルは不要
    modulePreload: { polyfill: false },
  },
}));
