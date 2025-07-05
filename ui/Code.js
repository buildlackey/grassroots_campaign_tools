function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📍 Distance Filter')
    .addItem('Filter By Distance', 'showAutocompleteDialog')
    .addItem('Add Lat/Long Info', 'populateLatLong')
    .addToUi();
}

function showAutocompleteDialog() {
  const html = HtmlService.createHtmlOutputFromFile('FilterUI')
    .setWidth(700)   // ✅ Now applies in modal dialogs
    .setHeight(500); // Optional, but helps avoid scroll
  SpreadsheetApp.getUi().showModalDialog(html, 'Address Autocomplete');
}

