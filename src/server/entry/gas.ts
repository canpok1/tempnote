// GAS の入口。ここで公開した関数は、ビルド時に GAS の直下へ書き出される（vite.server.config.ts）。

import { createMaintenance, createUseCases } from "../application/useCases";
import { CLEANUP_HANDLER, ensureCleanupTrigger } from "../infrastructure/gas/cleanupTrigger";
import { createGasPorts } from "../infrastructure/gas/gasPorts";
import { createDispatcher } from "./dispatcher";

const ports = createGasPorts();
const dispatch = createDispatcher(createUseCases(ports));
const maintenance = createMaintenance(ports);

/** 設定シートの項目を揃え、削除のトリガーを設定の間隔に合わせる。失敗しても呼び出し元の処理は続ける */
const prepareCleanup = () => {
  try {
    const { settings, complete } = ports.settings.inspect();
    if (!complete) ports.lock.run(() => ports.settings.fillDefaults());
    ensureCleanupTrigger(ports.lock, settings.cleanupIntervalDays);
  } catch (e) {
    // 次に開かれたときや、次にトリガーが動いたときにまた揃えにいく
    console.error(e);
  }
};

export const doGet = () => {
  prepareCleanup();
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("tempnote")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
};

/** google.script.run から呼ばれる唯一の関数 */
export const api = (method: string, input: unknown) => dispatch(method, input);

/** 時間トリガーから呼ばれる。名前は cleanupTrigger.ts の CLEANUP_HANDLER と揃える */
export const deleteExpiredNotebooks = () => {
  const deleted = maintenance.deleteExpiredNotebooks();
  console.log(`${CLEANUP_HANDLER}: ${deleted} 冊を削除しました`);
  // 画面が開かれないまま間隔を変えても、次の実行から新しい間隔になるようにする
  prepareCleanup();
};
