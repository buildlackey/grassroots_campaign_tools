function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📍 Distance Filter3')
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


function getMapsApiKey() {
  const key = PropertiesService.getScriptProperties().getProperty("GOOGLE_MAPS_API_KEY");
  if (!key) throw new Error("API key not found in script properties.");
  return key;
}

