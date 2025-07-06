function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📍 Distance Filter9')
    .addItem('Filter By Distance', 'showAutocompleteDialog')
    .addItem('Add Lat/Long Info', 'populateLatLong')
    .addToUi();
}

function showAutocompleteDialog() {
  const html = HtmlService.createHtmlOutputFromFile('FilterUI')
    .setWidth(700)   // ✅ Now applies in modal dialogs
    .setHeight(500); // Optional, but helps avoid scroll
  SpreadsheetApp.getUi().showModalDialog(html, 'Filter by Distance');
}


function getDebug() {
  const raw = PropertiesService.getScriptProperties().getProperty("DEBUG");
  // Any value other than the exact string "false" (case-insensitive) counts as true
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

  // Find the first non-empty row (e.g. row 5 = index 4)
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


