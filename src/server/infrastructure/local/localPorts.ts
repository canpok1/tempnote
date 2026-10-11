import type { Ports } from "../../application/ports";
import { createMemoryRepositories, sharedMemoryStore } from "./memoryRepositories";

export const createLocalPorts = (): Ports => ({
  ...createMemoryRepositories(sharedMemoryStore()),
  clock: { now: () => new Date() },
  ids: { generate: () => crypto.randomUUID().replace(/-/g, "") },
  // 開発サーバーは1つのプロセスで順に処理するので、直列化は要らない
  lock: { run: (task) => task() },
});
