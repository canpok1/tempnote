// ローカルの入口。Vite 開発サーバーの /api から呼ばれる（vite.config.ts）。

import { createMaintenance, createUseCases } from "../application/useCases";
import { createLocalPorts } from "../infrastructure/local/localPorts";
import { sharedMemoryStore } from "../infrastructure/local/memoryRepositories";
import { createDispatcher } from "./dispatcher";

const ports = createLocalPorts();

export const dispatch = createDispatcher(createUseCases(ports));

/** 開発・E2E 用の操作。開発サーバーの /__dev から呼ばれ、本番には存在しない */
export const devTools = {
  /** サーバーの時計を進める */
  advanceClock: (days: number) => {
    sharedMemoryStore().clockOffsetMs += days * 24 * 60 * 60 * 1000;
  },
  /** GAS の時間トリガーが1日1回呼ぶ処理を今すぐ実行する */
  deleteExpiredNotebooks: () => createMaintenance(ports).deleteExpiredNotebooks(),
};
