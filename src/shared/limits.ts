// 画面とサーバーの両方が使う上限値。サーバーはこれを超える保存を断り、画面は入力の目安として表示する。

/** 1冊に入るメモの数 */
export const MAX_MEMOS_PER_NOTEBOOK = 100;
/** 本文の文字数。スプレッドシートの1セルに入る上限 */
export const MAX_BODY_LENGTH = 50_000;
/** タイトルの文字数 */
export const MAX_TITLE_LENGTH = 200;
