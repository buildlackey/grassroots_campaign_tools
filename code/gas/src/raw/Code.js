function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📍 Campaign Figs')
    .addItem('Filter By Distance', 'showAutocompleteDialog')
    .addToUi();
}



function showAutocompleteDialog() {
    alert("fake show");
}


function smokeTest() {
  return 'SUCCESS';
}

