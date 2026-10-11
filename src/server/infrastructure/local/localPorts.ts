import type { Ports } from "../../application/ports";
import { parseSettings } from "../../domain/settings";
import { createMemoryRepositories, sharedMemoryStore } from "./memoryRepositories";

const store = sharedMemoryStore();

export const createLocalPorts = (): Ports => ({
  ...createMemoryRepositories(store),
  settings: { load: () => parseSettings(store.settings) },
  // E2E で30日後を試せるよう、開発用の口（entry/local.ts）から時計を進められる
  clock: { now: () => new Date(Date.now() + store.clockOffsetMs) },
  // ローカルには Google アカウントが無いので、固定の仮ユーザーにする
  user: { email: () => "local-user@example.com" },
  ids: { generate: () => crypto.randomUUID().replace(/-/g, "") },
  // 開発サーバーは1つのプロセスで順に処理するので、直列化は要らない
  lock: { run: (task) => task() },
});
