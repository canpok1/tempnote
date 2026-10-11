// 構築済みの環境へ、今のコードをデプロイする。URL は変わらない。
//   npm run deploy
// ID は .clasp.json / .deploy.json から読む。CI では環境変数 SCRIPT_ID / DEPLOYMENT_ID / DEPLOY_NAME / ALLOW_ANYONE から読む。

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { assertClaspLogin, build, CLASP_FILE, DEPLOY_FILE, ROOT_DIR, run, webAppUrl } from "./lib.mjs";

const saved = existsSync(DEPLOY_FILE) ? JSON.parse(readFileSync(DEPLOY_FILE, "utf8")) : {};
const deploymentId = process.env.DEPLOYMENT_ID || saved.deploymentId;
const name = process.env.DEPLOY_NAME || saved.name || "web";
const allowAnyone = process.env.ALLOW_ANYONE ? process.env.ALLOW_ANYONE === "true" : saved.allowAnyone === true;

if (!existsSync(CLASP_FILE)) {
  if (!process.env.SCRIPT_ID) {
    console.error(`${CLASP_FILE} がありません。先に \`npm run setup\` を実行するか、環境変数 SCRIPT_ID を指定してください。`);
    process.exit(1);
  }
  writeFileSync(CLASP_FILE, `${JSON.stringify({ scriptId: process.env.SCRIPT_ID, rootDir: ROOT_DIR }, null, 2)}\n`);
}
if (!deploymentId) {
  console.error(`デプロイ ID がありません。${DEPLOY_FILE} か環境変数 DEPLOYMENT_ID を用意してください。`);
  process.exit(1);
}
assertClaspLogin();

build(allowAnyone);
run("npx", ["clasp", "push", "--force"]);
run("npx", ["clasp", "create-deployment", "--deploymentId", deploymentId, "--description", name]);
console.log(`\nデプロイしました: ${webAppUrl(deploymentId)}`);
