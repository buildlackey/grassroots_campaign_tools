
function filterByDistance() {
  const html = HtmlService.createHtmlOutputFromFile('FilterUI')
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, "Filter Volunteers by Distance");
}

function dummyHandler(address, distance) {
  Logger.log(`📍 Filter request: address="${address}", distance="${distance}"`);
}

