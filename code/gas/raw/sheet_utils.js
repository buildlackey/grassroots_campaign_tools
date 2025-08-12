// gas/src/lib/sheets.js
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

function getSheetTabNames(ss) {
  console.log("📥 ENTER getSheetTabNames", { ssProvided: !!ss });
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var result = ss.getSheets().map(function (s) { return s.getName(); });
  console.log("📤 EXIT getSheetTabNames →", JSON.stringify(result));
  return result;
}

function getSheetByName(name, ss) {
  console.log("📥 ENTER getSheetByName", { name: name, ssProvided: !!ss });
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var result = ss.getSheetByName(name) || null;
  console.log("📤 EXIT getSheetByName →", result ? `Sheet(${result.getName()})` : "null");
  return result;
}

function getHeaderInfo(sheet) {
  console.log("📥 ENTER getHeaderInfo", { sheetName: sheet ? sheet.getName() : null });
  var values = sheet.getDataRange().getValues();
  var idx = findHeaderRowIndex_(values);
  var result = (idx === -1)
    ? { index: -1, headers: [] }
    : { index: idx, headers: normalizeRow_(values[idx]) };
  console.log("📤 EXIT getHeaderInfo →", JSON.stringify(result));
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

// Expose to GAS
globalThis.sheets = { getSheetTabNames, getSheetByName, getHeaderInfo, ensureColumns };

