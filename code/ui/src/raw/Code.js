/**
 * ========= Code.js (GAS, mock-only) =========
 * - Always returns the same mock data as your jsdom tests
 * - Adds a "Settings" menu with a single item to open the dialog
 */

/** Server-side include so <?!= include('...') ?> works in HTML files */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** Add a minimal menu to open the Settings dialog */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙️ Current Settings')
    .addItem('Open Settings', 'showSettingsDialog')
    .addToUi();
}

/** Show the Settings dialog (uses SettingsDialog.html + includes) */
function showSettingsDialog() {
  var html = HtmlService
    .createTemplateFromFile('SettingsDialog')
    .evaluate()
    .setTitle('⚙️ Settings')
    .setWidth(580)
    .setHeight(400);

  SpreadsheetApp.getUi().showModalDialog(html, 'Settings');
}

/** Always return mock sheet names */
function getSheetTabNames() {
  Logger.log('📡 Mock getSheetTabNames called');
  return ['Sheet1', 'Sheet2', 'Sheet3'];
}

/** Always return mock headers (Sheet2 has ["Name", "Address"], others empty) */
function getHeadersForSheet(sheetName) {
  Logger.log('📡 Mock getHeadersForSheet called with: %s', sheetName);
  var headers = (sheetName === 'Sheet2') ? ['Name', 'Address'] : [];
  return { headers: headers };
}

/** Simulate saving preferences (no persistence) */
function savePreferences(prefs) {
  Logger.log('💾 Saved preferences: %s', JSON.stringify(prefs));
  return true;
}

/** Always return a placeholder Maps API key */
function getMapsApiKey() {
  return 'MOCK_API_KEY';
}

/** Always return debug = false */
function getDebug() {
  return false;
}

function smokeTest() {
  return 'SUCCESS';
}
