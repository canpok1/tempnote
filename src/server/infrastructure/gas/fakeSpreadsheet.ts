// テスト用の SpreadsheetApp もどき。sheets.ts が使う操作だけを、GAS と同じ約束で真似る。
// - シートの既定の大きさは 1000行×26列
// - 範囲がシートの外にはみ出すと例外
// - 値は書いたものがそのまま返る（書式は記録だけする）

import type { BookLike, RangeLike, SheetLike } from "./sheets";

export class FakeSheet implements SheetLike {
  maxRows = 1000;
  maxColumns = 26;
  /** cells[行-1][列-1]。書いていないセルは undefined */
  cells: unknown[][] = [];
  /** 書式を設定したセル（"行,列"） */
  textCells = new Set<string>();

  constructor(readonly name: string) {}

  getLastRow() {
    for (let r = this.cells.length; r > 0; r--)
      if (this.cells[r - 1]?.some((v) => v !== "" && v !== undefined)) return r;
    return 0;
  }

  getLastColumn() {
    let last = 0;
    for (const row of this.cells) {
      row?.forEach((v, c) => {
        if (v !== "" && v !== undefined) last = Math.max(last, c + 1);
      });
    }
    return last;
  }

  getMaxRows() {
    return this.maxRows;
  }

  getMaxColumns() {
    return this.maxColumns;
  }

  getRange(row: number, column: number, numRows: number, numColumns: number): RangeLike {
    if (row < 1 || column < 1 || row + numRows - 1 > this.maxRows || column + numColumns - 1 > this.maxColumns) {
      throw new Error(`範囲がシートの外です: ${row},${column},${numRows},${numColumns}`);
    }
    const range: RangeLike = {
      getValues: () =>
        Array.from({ length: numRows }, (_, r) =>
          Array.from({ length: numColumns }, (_, c) => this.cells[row - 1 + r]?.[column - 1 + c] ?? ""),
        ),
      setValues: (values) => {
        if (values.length !== numRows || values.some((v) => v.length !== numColumns)) {
          throw new Error("値の大きさが範囲と合いません");
        }
        values.forEach((cells, r) => {
          this.cells[row - 1 + r] ??= [];
          cells.forEach((v, c) => {
            this.cells[row - 1 + r][column - 1 + c] = v;
          });
        });
        return range;
      },
      setNumberFormat: (format) => {
        if (format === "@") {
          for (let r = 0; r < numRows; r++)
            for (let c = 0; c < numColumns; c++) this.textCells.add(`${row + r},${column + c}`);
        }
        return range;
      },
    };
    return range;
  }

  insertRowsAfter(_afterPosition: number, howMany: number) {
    this.maxRows += howMany;
    return this;
  }

  insertColumnsAfter(_afterPosition: number, howMany: number) {
    this.maxColumns += howMany;
    return this;
  }

  deleteRows(rowPosition: number, howMany: number) {
    if (this.maxRows - howMany < 1) throw new Error("すべての行は削除できません");
    this.cells.splice(rowPosition - 1, howMany);
    this.maxRows -= howMany;
    return this;
  }

  deleteColumns(columnPosition: number, howMany: number) {
    if (this.maxColumns - howMany < 1) throw new Error("すべての列は削除できません");
    for (const row of this.cells) row?.splice(columnPosition - 1, howMany);
    this.maxColumns -= howMany;
    return this;
  }
}

export class FakeBook implements BookLike {
  sheets = new Map<string, FakeSheet>();

  getSheetByName(name: string) {
    return this.sheets.get(name) ?? null;
  }

  insertSheet(sheetName: string) {
    if (this.sheets.has(sheetName)) throw new Error(`同じ名前のシートがあります: ${sheetName}`);
    const sheet = new FakeSheet(sheetName);
    this.sheets.set(sheetName, sheet);
    return sheet;
  }

  deleteSheet(sheet: SheetLike) {
    if (this.sheets.size <= 1) throw new Error("最後のシートは削除できません");
    for (const [name, s] of this.sheets) if (s === sheet) this.sheets.delete(name);
  }
}
