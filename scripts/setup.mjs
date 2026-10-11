// 空のスプレッドシートに tempnote を構築する。
//   npm run setup -- <スプレッドシートID> [--name <デプロイ名>] [--allow-anyone]
// スプレッドシートに紐づく GAS プロジェクトを作り、ビルド・push・デプロイまで行う。
// 作った ID は git 管理外の .clasp.json と .deploy.json に保存する。

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { assertClaspLogin, build, CLASP_FILE, claspJson, DEPLOY_FILE, ROOT_DIR, run, webAppUrl } from "./lib.mjs";

const args = process.argv.slice(2);
const allowAnyone = args.includes("--allow-anyone");
const nameIndex = args.indexOf("--name");
// GAS の「デプロイを管理」で環境を見分けるための名前（デプロイの説明）
const name = nameIndex >= 0 ? args[nameIndex + 1] : "development";
const spreadsheetId = args.find((a, i) => !a.startsWith("--") && (nameIndex < 0 || i !== nameIndex + 1));

if (!spreadsheetId || !name || name.startsWith("--")) {
  console.error("使い方: npm run setup -- <スプレッドシートID> [--name <デプロイ名>] [--allow-anyone]");
  process.exit(1);
}
if (existsSync(CLASP_FILE) || existsSync(DEPLOY_FILE)) {
  console.error(`${CLASP_FILE} か ${DEPLOY_FILE} が既にあります。構築済みならデプロイは \`npm run deploy\` を使ってください。`);
  process.exit(1);
}
assertClaspLogin();

console.log("\n== GAS プロジェクトを作成（スプレッドシートに紐づけ） ==");
mkdirSync(ROOT_DIR, { recursive: true });
const { scriptId } = claspJson(["create-script", "--parentId", spreadsheetId, "--title", "tempnote", "--rootDir", ROOT_DIR]);

console.log("\n== ビルド ==");
build(allowAnyone);

console.log("\n== push ==");
run("npx", ["clasp", "push", "--force"]);

console.log("\n== デプロイ ==");
const { deploymentId } = claspJson(["create-deployment", "--description", name]);
writeFileSync(DEPLOY_FILE, `${JSON.stringify({ deploymentId, name, allowAnyone }, null, 2)}\n`);

console.log(`
構築が終わりました。

1. 次の URL をこのアカウントで開き、権限を承認してください。
   ${webAppUrl(deploymentId)}

2. 自動デプロイを使う場合は、GitHub の Environment に次を登録してください。
   シークレット SCRIPT_ID     = ${scriptId}
   シークレット DEPLOYMENT_ID = ${deploymentId}
   シークレット CLASPRC_JSON  = ~/.clasprc.json の中身
${allowAnyone ? "   変数 ALLOW_ANYONE          = true\n" : ""}`);
