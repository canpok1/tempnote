// 運用者が変えられる設定。GAS ではスプレッドシートの settings シートに、キーと値の組で持つ。

export type Settings = {
  /** 最後に開いてからこの日数がたったメモ帳を、中のメモごと削除する */
  expiryDays: number;
  /** 期限切れのメモ帳を探して削除する間隔（日） */
  cleanupIntervalDays: number;
};

export type SettingKey = keyof Settings;

export const DEFAULT_SETTINGS: Settings = { expiryDays: 30, cleanupIntervalDays: 1 };

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

const DIGITS = /^[0-9]+$/;

/**
 * キーごとの文字列から設定を作る。空・1以上の整数でない値は既定値にする。
 * 書き間違いで削除が止まったり、すべてのメモ帳が消えたりしないよう、例外にはしない。
 */
export const parseSettings = (raw: Partial<Record<string, string>>): Settings => {
  const settings = { ...DEFAULT_SETTINGS };
  for (const key of SETTING_KEYS) {
    const value = raw[key]?.trim() ?? "";
    if (DIGITS.test(value) && Number(value) >= 1) settings[key] = Number(value);
  }
  return settings;
};
