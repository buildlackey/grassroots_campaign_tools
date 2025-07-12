function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Menu')
    .addItem('Show Form', 'showForm')
    .addToUi();
}

function showForm() {
  const html = HtmlService.createTemplateFromFile('FilterUI');
  const output = html.evaluate()
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(output, 'My Form');
}

// Make sure this is at TOP LEVEL (not nested)
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// MUST be at TOP LEVEL to be callable from client
function processForm(data) {
  try {
    SpreadsheetApp.getUi().alert(`Received: ${JSON.stringify(data)}`);
    return { success: true, message: 'Data processed successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

