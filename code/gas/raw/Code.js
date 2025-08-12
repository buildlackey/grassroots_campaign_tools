function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📍 Campaign')
    .addItem('Filter By Distance', 'showAutocompleteDialog')
    .addToUi();
}



function showAutocompleteDialog() {
    alert("fake show");
}

