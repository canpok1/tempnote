import type { Ports } from "../../application/ports";
import { createSheetRepositories } from "./sheetRepositories";

/** 他の利用者の書き込みを待つ上限。超えたら例外にする */
const LOCK_TIMEOUT_MS = 10_000;

const activeBook = () => {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error("スクリプトがスプレッドシートに紐づいていません");
  return book;
};

export const createGasPorts = (): Ports => ({
  ...createSheetRepositories(activeBook),
  clock: { now: () => new Date() },
  // 「実行ユーザー: デプロイした自分」で公開しているため、取れるのはデプロイした人と同じ Workspace ドメインの利用者だけ
  user: { email: () => Session.getActiveUser().getEmail() },
  ids: { generate: () => Utilities.getUuid().replace(/-/g, "") },
  lock: {
    run: (task) => {
      const lock = LockService.getScriptLock();
      lock.waitLock(LOCK_TIMEOUT_MS);
      try {
        return task();
      } finally {
        lock.releaseLock();
      }
    },
  },
});
