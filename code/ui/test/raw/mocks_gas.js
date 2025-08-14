/**
 * Static GAS mock for local UI testing
 *
 * This is used when you open SettingsDialog.html directly in a browser without
 * Apps Script running in the background.
 *
 * Always returns the same data:
 *   - Sheet1: []
 *   - Sheet2: ["Name", "Address", "Phone"]
 *   - Sheet3: []
 */
// code/ui/test/raw/mocks_gas.js
function installMockGoogleScript(window) {
  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = {
    withSuccessHandler(callback) {
      return {
        withFailureHandler: function () { return this; },
        getSheetTabsAndColumnNames: function () {
          callback({
            sheetTabNames: ["Sheet1", "Sheet2", "Sheet3"],
            sheetTabToColumnNames: {
              Sheet1: [],
              Sheet2: ["Name", "Address", "Phone"],
              Sheet3: []
            }
          });
        }
      };
    }
  };
}
module.exports = { installMockGoogleScript };
