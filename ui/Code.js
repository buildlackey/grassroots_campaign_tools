function onOpen() {
  console.log(" calling..  onOpen");
  SpreadsheetApp.getUi()
    .createMenu('📍 Distance Filter0')
    .addItem('Filter By Distance', 'showAutocompleteDialog')
    .addItem('Add Lat/Long Info', 'populateLatLong')
    .addToUi();
}


function showAutocompleteDialog() {
    alert("showAutocompleteDialog");
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

