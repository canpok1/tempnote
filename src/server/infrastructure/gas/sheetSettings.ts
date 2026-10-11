// GAS 用の設定の置き場所。シート settings に1行1項目で、キー・値・説明を持つ。
// 運用者がスプレッドシートで値を書き換えると、次に読んだときから効く。

import type { SettingsRepository } from "../../application/ports";
import { DEFAULT_SETTINGS, parseSettings, SETTING_KEYS, type SettingKey, type Settings } from "../../domain/settings";
import { type BookLike, openTable } from "./sheets";

export const SETTINGS_SHEET = "settings";
const COLUMNS = ["key", "value", "description"] as const;

const DESCRIPTIONS: Record<SettingKey, string> = {
  expiryDays: "最後に開いてからこの日数がたったメモ帳を、中のメモごと削除する",
  cleanupIntervalDays: "期限切れのメモ帳を探して削除する間隔（日）。3時ごろに実行する",
};

export type SheetSettingsRepository = SettingsRepository & {
  /** 設定と、すべての項目がシートに書かれているか */
  inspect(): { settings: Settings; complete: boolean };
  /** シートが無ければ作り、書かれていない項目を既定値で書き足す。ロックの中で呼ぶ */
  fillDefaults(): void;
};

export const createSheetSettings = (book: () => BookLike): SheetSettingsRepository => {
  const table = () => openTable(book(), SETTINGS_SHEET, COLUMNS);
  /** キーごとの値。同じキーが複数行あれば上の行を使う */
  const read = (): Map<string, string> => {
    const values = new Map<string, string>();
    // 読むだけのときはシートを作らない（作るのはロックの中の fillDefaults に任せる）
    if (!book().getSheetByName(SETTINGS_SHEET)) return values;
    for (const { values: row } of table().rows()) {
      const key = row.key.trim();
      if (!values.has(key)) values.set(key, row.value);
    }
    return values;
  };
  const inspect = () => {
    const values = read();
    return {
      settings: parseSettings(Object.fromEntries(values)),
      complete: SETTING_KEYS.every((key) => values.has(key)),
    };
  };
  return {
    load: () => inspect().settings,
    inspect,
    fillDefaults: () => {
      const values = read();
      const target = table();
      for (const key of SETTING_KEYS) {
        if (values.has(key)) continue;
        target.append({ key, value: String(DEFAULT_SETTINGS[key]), description: DESCRIPTIONS[key] });
      }
    },
  };
};
