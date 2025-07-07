function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📍 Distance Filter2')
    .addItem('Filter By Distance', 'showAutocompleteDialog')
    .addItem('Add Lat/Long Info', 'populateLatLong')
    .addToUi();
}

function showAutocompleteDialog() {
  const html = HtmlService.createHtmlOutputFromFile('FilterUI')
    .setWidth(700)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, 'Filter by Distance');
}

function getDebug() {
  const raw = PropertiesService.getScriptProperties().getProperty("DEBUG");
  return String(raw).toLowerCase() !== "false";
}

function getMapsApiKey() {
  const key = PropertiesService.getScriptProperties().getProperty("GOOGLE_MAPS_API_KEY");
  if (!key) throw new Error("API key not found in script properties.");
  return key;
}

function getCandidates() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  const headerRowIndex = data.findIndex(row =>
    row.some(cell => String(cell).toLowerCase().includes("lat") || String(cell).toLowerCase().includes("long"))
  );

  if (headerRowIndex === -1) throw new Error("No header row with lat/long found.");

  const headers = data[headerRowIndex];
  const latIndex = headers.findIndex(h => h.toLowerCase().includes("lat"));
  const lngIndex = headers.findIndex(h => h.toLowerCase().includes("lon") || h.toLowerCase().includes("lng"));
  const addrIndex = headers.findIndex(h => h.toLowerCase().includes("address"));

  if (latIndex === -1 || lngIndex === -1) {
    throw new Error("Could not find 'Lat' and 'Long' columns.");
  }

  return data
    .slice(headerRowIndex + 1)
    .filter(row => row[latIndex] && row[lngIndex])
    .map(row => ({
      address: addrIndex !== -1 ? row[addrIndex] : "(no label)",
      lat: parseFloat(row[latIndex]),
      lng: parseFloat(row[lngIndex])
    }));
}

function filterAndWriteMatches(lat0, lng0, radiusMiles) {
  const result = filterMatchingRows(lat0, lng0, radiusMiles);

  if (result.rows.length === 0) {
    return { matched: false };
  }

  const sheetName = `${radiusMiles}.mile.matches.${Math.floor(Date.now() / 1000)}`;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const outSheet = ss.insertSheet(sheetName);
  outSheet.appendRow(result.headers);
  result.rows.forEach(row => outSheet.appendRow(row));

  return { matched: true, sheetName, count: result.rows.length };
}

function filterMatchingRows(lat0, lng0, radiusMiles) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  const headerRowIndex = data.findIndex(row =>
    row.some(cell => String(cell).toLowerCase().includes("lat") || String(cell).toLowerCase().includes("long"))
  );

  if (headerRowIndex === -1) throw new Error("No header row with lat/long found.");

  const headers = data[headerRowIndex];
  const latIndex = headers.findIndex(h => h.toLowerCase().includes("lat"));
  const lngIndex = headers.findIndex(h => h.toLowerCase().includes("lon") || h.toLowerCase().includes("lng"));

  const matchingRows = data
    .slice(headerRowIndex + 1)
    .filter(row => {
      const lat = parseFloat(row[latIndex]);
      const lng = parseFloat(row[lngIndex]);
      if (isNaN(lat) || isNaN(lng)) return false;
      const dist = haversineMiles(lat0, lng0, lat, lng);
      return dist <= radiusMiles;
    });

  return { headers, rows: matchingRows };
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


