function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧭 Distance Filter')
    .addItem('Open Address Autocomplete', 'showAutocompleteSidebar')
    .addToUi();
}

function showAutocompleteSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('FilterUI')  // 🔁 Match this to FilterUI.html
    .setTitle('Address Autocomplete')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}


function logLinkedSpreadsheetUrl() {
  const url = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  Logger.log("📄 Sheet URL: " + url);
}

