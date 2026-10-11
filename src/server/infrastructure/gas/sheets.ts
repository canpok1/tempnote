// スプレッドシートを「ヘッダー付きの表」として読み書きする。列の位置ではなく1行目のヘッダー名で読む。
// GAS の SpreadsheetApp のうち使う部分だけを型にしておき、テストでは同じ形のフェイクを渡す。

export type RangeLike = {
  getValues(): unknown[][];
  setValues(values: unknown[][]): RangeLike;
  setNumberFormat(format: string): RangeLike;
};

/** 行や列を足し引きするメソッドの戻り値は型定義によって Sheet と void が混在するので、使わない前提で unknown にしている */
export type SheetLike = {
  getLastRow(): number;
  getLastColumn(): number;
  getMaxRows(): number;
  getMaxColumns(): number;
  getRange(row: number, column: number, numRows: number, numColumns: number): RangeLike;
  insertRowsAfter(afterPosition: number, howMany: number): unknown;
  insertColumnsAfter(afterPosition: number, howMany: number): unknown;
  deleteRows(rowPosition: number, howMany: number): unknown;
  deleteColumns(columnPosition: number, howMany: number): unknown;
};

export type BookLike = {
  getSheetByName(name: string): SheetLike | null;
  insertSheet(sheetName: string): SheetLike;
};

/** セルはすべて書式なしテキストにする。日時や数字だけの ID が日付・数値に変換されないように */
const TEXT = "@";

export type Table<C extends string> = {
  /** 2行目以降を、ヘッダー名をキーにした行として返す。rowNumber はシート上の行番号 */
  rows(): { rowNumber: number; values: Record<C, string> }[];
  append(values: Record<C, string>): void;
  /** 指定した行の、この表が知っている列だけを書き換える。知らない列はそのまま残す */
  update(rowNumber: number, values: Record<C, string>): void;
};

const toText = (cell: unknown): string => (cell instanceof Date ? cell.toISOString() : String(cell ?? ""));

/**
 * シートを表として開く。シートやヘッダーが無ければ作る（何度呼んでも同じ結果になる）。
 * 新しく作ったシートは列数を columns に、行数をヘッダーの1行に縮める。
 * 既定の 1000行×26列 のままだと、スプレッドシート全体の1000万セルの上限にすぐ届くため。
 */
export const openTable = <C extends string>(book: BookLike, name: string, columns: readonly C[]): Table<C> => {
  let sheet = book.getSheetByName(name);
  if (!sheet) {
    sheet = book.insertSheet(name);
    if (sheet.getMaxColumns() > columns.length) {
      sheet.deleteColumns(columns.length + 1, sheet.getMaxColumns() - columns.length);
    }
    if (sheet.getMaxRows() > 1) sheet.deleteRows(2, sheet.getMaxRows() - 1);
  }
  const target = sheet;

  const lastColumn = target.getLastColumn();
  const header = lastColumn > 0 ? target.getRange(1, 1, 1, lastColumn).getValues()[0].map(toText) : [];
  const missing = columns.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    const shortage = header.length + missing.length - target.getMaxColumns();
    if (shortage > 0) target.insertColumnsAfter(target.getMaxColumns(), shortage);
    target
      .getRange(1, header.length + 1, 1, missing.length)
      .setNumberFormat(TEXT)
      .setValues([missing]);
    header.push(...missing);
  }
  const indexOf = (column: C) => header.indexOf(column);

  return {
    rows: () => {
      const lastRow = target.getLastRow();
      if (lastRow < 2) return [];
      return target
        .getRange(2, 1, lastRow - 1, header.length)
        .getValues()
        .map((cells, i) => ({
          rowNumber: i + 2,
          values: Object.fromEntries(columns.map((c) => [c, toText(cells[indexOf(c)])])) as Record<C, string>,
        }));
    },
    append: (values) => {
      const rowNumber = target.getLastRow() + 1;
      if (rowNumber > target.getMaxRows()) target.insertRowsAfter(target.getMaxRows(), rowNumber - target.getMaxRows());
      const cells = header.map((h) => (columns.includes(h as C) ? values[h as C] : ""));
      target.getRange(rowNumber, 1, 1, header.length).setNumberFormat(TEXT).setValues([cells]);
    },
    update: (rowNumber, values) => {
      const range = target.getRange(rowNumber, 1, 1, header.length);
      const cells = range.getValues()[0];
      for (const c of columns) cells[indexOf(c)] = values[c];
      range.setNumberFormat(TEXT).setValues([cells]);
    },
  };
};
