/** ISO 形式の日時を、見る人のタイムゾーンで「2026/10/11 15:00」のように表す */
export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" });
