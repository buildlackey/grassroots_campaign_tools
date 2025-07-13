
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Custom Menu')
    .addItem('Show Dialog', 'showDialog')
    .addToUi();
}

function showDialog() {
  const html = HtmlService.createTemplateFromFile('FilterUI');
  const output = html.evaluate()
    .setWidth(300)
    .setHeight(150);
  SpreadsheetApp.getUi().showModalDialog(output, 'Greeting');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getServerMessage() {
  return "Hello - " + new Date().toLocaleString();
}
