function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📍 Campaign Figs')
    .addItem('Open Settings', 'showSettingsDialog')
    .addToUi();
}


/** Show the Settings dialog (uses SettingsDialog.html + includes) */
function showSettingsDialog() {
  var html = HtmlService
    .createTemplateFromFile('SettingsDialog')
    .evaluate()
    .setTitle('⚙️ Settings')
    .setWidth(380)
    .setHeight(400);

  SpreadsheetApp.getUi().showModalDialog(html, 'Settings');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function smokeTest() {
  return 'SUCCESS';
}

