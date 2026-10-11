// GAS の入口。ここで公開した関数は、ビルド時に GAS の直下へ書き出される（vite.server.config.ts）。

import { createUseCases } from "../application/useCases";
import { createGasPorts } from "../infrastructure/gas/gasPorts";
import { createDispatcher } from "./dispatcher";

const dispatch = createDispatcher(createUseCases(createGasPorts()));

export const doGet = () =>
  HtmlService.createHtmlOutputFromFile("index")
    .setTitle("tempnote")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");

/** google.script.run から呼ばれる唯一の関数 */
export const api = (method: string, input: unknown) => dispatch(method, input);
