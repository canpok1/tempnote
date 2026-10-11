// GAS の入口。ここで公開した関数は、ビルド時に GAS の直下へ書き出される（vite.server.config.ts）。

import { createMaintenance, createUseCases } from "../application/useCases";
import { DAILY_HANDLER, ensureDailyTrigger } from "../infrastructure/gas/dailyTrigger";
import { createGasPorts } from "../infrastructure/gas/gasPorts";
import { createDispatcher } from "./dispatcher";

const ports = createGasPorts();
const dispatch = createDispatcher(createUseCases(ports));
const maintenance = createMaintenance(ports);

export const doGet = () => {
  try {
    ensureDailyTrigger(ports.lock);
  } catch (e) {
    // トリガーを作れなくても画面は出す。次に開かれたときにまた作りにいく
    console.error(e);
  }
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("tempnote")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
};

/** google.script.run から呼ばれる唯一の関数 */
export const api = (method: string, input: unknown) => dispatch(method, input);

/** 1日1回の時間トリガーから呼ばれる。名前は dailyTrigger.ts の DAILY_HANDLER と揃える */
export const deleteExpiredNotebooks = () => {
  const deleted = maintenance.deleteExpiredNotebooks();
  console.log(`${DAILY_HANDLER}: ${deleted} 冊を削除しました`);
};
