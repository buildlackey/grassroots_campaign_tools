// gas/src/lib/sheets.js

var MAX_SCAN_ROWS = 20;        // Scan at most this many rows from the top
var MIN_NONEMPTY_CELLS = 1;    // Require at least this many non-empty cells

function _detectHeaderRowTop_(sheet) {
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastCol === 0 || lastRow === 0) return [];

  var scanRows = Math.min(MAX_SCAN_ROWS, lastRow);
  var values = sheet.getRange(1, 1, scanRows, lastCol).getValues();

  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    // Trim and keep only non-empty cells
    var headers = [];
    for (var c = 0; c < row.length; c++) {
      var s = row[c] == null ? '' : String(row[c]).trim();
      if (s) headers.push(s);
    }
    if (headers.length >= MIN_NONEMPTY_CELLS) {
      return headers;
    }
  }
  return [];
}

function getSheetTabsAndColumnNames() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetTabNames = [];
  const sheetTabToColumnNames = {};

  ss.getSheets().forEach(function(sheet) {
    const sheetName = sheet.getName();
    sheetTabNames.push(sheetName);

    // Use the smart header row detection
    const headers = _detectHeaderRowTop_(sheet);
    sheetTabToColumnNames[sheetName] = headers;
  });

  return {
    sheetTabNames,
    sheetTabToColumnNames
  };
}


function findHeaderRowIndex_(values) {
  for (var r = 0; r < values.length; r++) {
    var row = values[r] || [];
    for (var c = 0; c < row.length; c++) {
      if ((row[c] + '').trim() !== '') return r;
    }
  }
  return -1;
}

function normalizeRow_(row) {
  return (row || []).map(function (cell) { return (cell == null ? '' : ('' + cell).trim()); });
}

function getSheetByName(name, ss) {
  console.log("📥 ENTER getSheetByName", { name: name, ssProvided: !!ss });
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var result = ss.getSheetByName(name) || null;
  console.log("📤 EXIT getSheetByName →", result ? `Sheet(${result.getName()})` : "null");
  return result;
}



function ensureColumns(sheet, headerIndex, names) {
  var values = sheet.getDataRange().getValues();
  var header = normalizeRow_(values[headerIndex] || []);
  var nextIndex = header.length;
  var result = {};
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var col = header.indexOf(name);
    if (col === -1) {
      col = nextIndex++;
      sheet.getRange(headerIndex + 1, col + 1).setValue(name);
      header[col] = name;
    }
    result[name] = col;
  }
  return result;
}

// In Jest/jsdom tests, the mock loader looks for functions under globalThis.sheets
// so it can stub them... hence the line below:
globalThis.sheets = {  getSheetByName,  ensureColumns };

