// GAS のマニフェスト dist/gas/appsscript.json を書き出す。
// 公開範囲は既定で同じドメイン内。ALLOW_ANYONE=true のときだけ Google アカウントを持つ全員に開く。

import { mkdirSync, writeFileSync } from "node:fs";

const allowAnyone = process.env.ALLOW_ANYONE === "true";

const manifest = {
  timeZone: "Asia/Tokyo",
  runtimeVersion: "V8",
  exceptionLogging: "STACKDRIVER",
  webapp: {
    executeAs: "USER_DEPLOYING",
    access: allowAnyone ? "ANYONE" : "DOMAIN",
  },
};

mkdirSync("dist/gas", { recursive: true });
writeFileSync("dist/gas/appsscript.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`appsscript.json: webapp.access = ${manifest.webapp.access}`);
