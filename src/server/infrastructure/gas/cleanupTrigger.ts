// 期限切れのメモ帳を消す時間トリガー。setup で作ると clasp から関数を実行する追加の設定が要るので、
// 画面が開かれたときなどに、設定の間隔のトリガーが無ければ作る（何度呼んでも1つだけになる）。

import type { Lock } from "../../application/ports";

/** トリガーから呼ぶ関数の名前。entry/gas.ts で export し、vite.server.config.ts の exposed にも載せる */
export const CLEANUP_HANDLER = "deleteExpiredNotebooks";
/** 実行する時刻（スクリプトのタイムゾーン、Asia/Tokyo）。利用者の少ない時間帯にする */
const RUN_AT_HOUR = 3;
/** トリガーからは間隔を読み出せないので、作ったときの間隔をスクリプトのプロパティに控えておく */
const INTERVAL_PROPERTY = "cleanupIntervalDays";

const handlerTriggers = () => ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === CLEANUP_HANDLER);

const isApplied = (intervalDays: number) =>
  handlerTriggers().length === 1 &&
  PropertiesService.getScriptProperties().getProperty(INTERVAL_PROPERTY) === String(intervalDays);

/** intervalDays 日ごとのトリガーが1つだけある状態にする。間隔が変わっていれば作り直す */
export const ensureCleanupTrigger = (lock: Lock, intervalDays: number) => {
  // ほとんどの呼び出しはすでに揃っているので、ロックを取らずに確かめて抜ける
  if (isApplied(intervalDays)) return;
  lock.run(() => {
    if (isApplied(intervalDays)) return;
    // 先に作ってから古いものを消す。作るのに失敗しても、古い間隔のまま削除は続く
    const old = handlerTriggers();
    ScriptApp.newTrigger(CLEANUP_HANDLER).timeBased().everyDays(intervalDays).atHour(RUN_AT_HOUR).create();
    for (const trigger of old) ScriptApp.deleteTrigger(trigger);
    PropertiesService.getScriptProperties().setProperty(INTERVAL_PROPERTY, String(intervalDays));
  });
};
