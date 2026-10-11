import type { Ports } from "../../application/ports";
import { createMemoryRepositories, sharedMemoryStore } from "./memoryRepositories";

export const createLocalPorts = (): Ports => ({
  ...createMemoryRepositories(sharedMemoryStore()),
  clock: { now: () => new Date() },
  // ローカルには Google アカウントが無いので、固定の仮ユーザーにする
  user: { email: () => "local-user@example.com" },
  ids: { generate: () => crypto.randomUUID().replace(/-/g, "") },
  // 開発サーバーは1つのプロセスで順に処理するので、直列化は要らない
  lock: { run: (task) => task() },
});
