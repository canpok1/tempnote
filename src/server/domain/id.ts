// メモ帳とメモの ID の形。UUID v4 からハイフンを抜いた32文字。

const ID_PATTERN = /^[0-9a-f]{32}$/;

export const isId = (id: unknown): id is string => typeof id === "string" && ID_PATTERN.test(id);
