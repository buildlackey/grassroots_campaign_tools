// code/gas/src/logic/SheetLayout.ts

/** Minimal sheet interface (duct-typed from GAS Sheet) */
interface ISheet {
  getName(): string;
  getLastColumn(): number;
  getLastRow(): number;
  getRange(row: number, col: number, numRows: number, numCols: number): {
    getValues(): any[][];
  };
}

/** Minimal spreadsheet interface (duct-typed from GAS Spreadsheet) */
interface ISpreadsheet {
  getSheets(): ISheet[];
}

class SheetLayout {
  private ss: ISpreadsheet;
  constructor(ss?: ISpreadsheet) {
    const spreadsheet = ss || (typeof SpreadsheetApp !== "undefined" ? SpreadsheetApp.getActiveSpreadsheet() : undefined);
    if (!spreadsheet) throw new Error("SheetLayout: No spreadsheet provided and SpreadsheetApp is not available.");
    this.ss = spreadsheet;
  }

  discover(): { sheetTabNames: string[]; sheetTabToColumnNames: Record<string, string[]> } {
    const sheetTabNames: string[] = [];
    const sheetTabToColumnNames: Record<string, string[]> = {};

    this.ss.getSheets().forEach((sheet) => {
      const sheetName = sheet.getName();
      sheetTabNames.push(sheetName);
      sheetTabToColumnNames[sheetName] = this.detectHeaderRowTop(sheet);
    });

    return { sheetTabNames, sheetTabToColumnNames };
  }

  private detectHeaderRowTop(sheet: ISheet): string[] {
    const MAX_SCAN_ROWS = 20;
    const MIN_NONEMPTY_CELLS = 1;

    const lastCol = sheet.getLastColumn();
    const lastRow = sheet.getLastRow();
    if (lastCol === 0 || lastRow === 0) return [];

    const scanRows = Math.min(MAX_SCAN_ROWS, lastRow);
    const values = sheet.getRange(1, 1, scanRows, lastCol).getValues();

    for (let r = 0; r < values.length; r++) {
      const headers = (values[r] || [])
        .map((c: any) => (c == null ? "" : String(c).trim()))
        .filter((s: string) => s);
      if (headers.length >= MIN_NONEMPTY_CELLS) return headers;
    }
    return [];
  }
}

/* Export to GAS global */
(globalThis as any).CAMPAIGN = (globalThis as any).CAMPAIGN || {};
(globalThis as any).CAMPAIGN.SheetLayout = SheetLayout;
