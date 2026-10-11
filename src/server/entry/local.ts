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
  /** 設定を書き換える。GAS 版で settings シートを編集するのにあたる。null の項目は消して既定値に戻す */
  setSettings: (values: Record<string, string | null>) => {
    const { settings } = sharedMemoryStore();
    for (const [key, value] of Object.entries(values)) {
      if (value === null) delete settings[key];
      else settings[key] = value;
    }
  },
  /** GAS の時間トリガーが定期的に呼ぶ処理を今すぐ実行する */
  deleteExpiredNotebooks: () => createMaintenance(ports).deleteExpiredNotebooks(),
};
