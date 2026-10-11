// 期限切れのメモ帳を消す時間トリガー。setup で作ると clasp から関数を実行する追加の設定が要るので、
// 画面が初めて開かれたときに、無ければ作る（何度呼んでも1つだけになる）。

import type { Lock } from "../../application/ports";

/** トリガーから呼ぶ関数の名前。entry/gas.ts で export し、vite.server.config.ts の exposed にも載せる */
export const DAILY_HANDLER = "deleteExpiredNotebooks";
/** 実行する時刻（スクリプトのタイムゾーン、Asia/Tokyo）。利用者の少ない時間帯にする */
const RUN_AT_HOUR = 3;

const exists = () => ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === DAILY_HANDLER);

export const ensureDailyTrigger = (lock: Lock) => {
  // ほとんどの呼び出しはすでにあるので、ロックを取らずに確かめて抜ける
  if (exists()) return;
  lock.run(() => {
    if (exists()) return;
    ScriptApp.newTrigger(DAILY_HANDLER).timeBased().everyDays(1).atHour(RUN_AT_HOUR).create();
  });
};
