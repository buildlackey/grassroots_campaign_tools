/**
 * Static GAS mock for local UI testing
 *
 * This is used when you open SettingsDialog.html directly in a browser without
 * Apps Script running in the background.
 *
 * Always returns the same data:        TODO - revisit.. is this right??
 *   - Sheet1: []
 *   - Sheet2: ["Name", "Address", "Phone"]
 *   - Sheet3: []
 */
// TODO - comment/explain how this is used for browser based testing
function installMockGoogleScript(window) {
  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.host = {
    close() { /* noop for tests */ }
  };

  window.google.script.run = {
    withSuccessHandler(successHandler) {
      // shared chain object that mimics GAS' proxy (chainable)
      const chain = {
        _success: successHandler,
        _failure: (e) => console.error("Mock failure:", e),

        withFailureHandler(failureHandler) {
          chain._failure = failureHandler;
          return chain;
        },

        // ✅ single, new endpoint only
        getSheetTabsAndColumnNames() {
          try {
            // Keep it stable for tests:
            // - Sheet1 has no headers
            // - Sheet2 has an "Address" header
            // - Sheet3 empty
            const payload = {
              sheetTabNames: ["Sheet1", "Sheet2", "Sheet3"],
              sheetTabToColumnNames: {
                Sheet1: [],
                Sheet2: ["Name", "Address", "Phone"],
                Sheet3: []
              }
            };
            chain._success(payload);
          } catch (e) {
            chain._failure(e);
          }
        },

        // Optional if your UI calls it; harmless to keep
        savePreferences(prefs) {
          try { chain._success(); } catch (e) { chain._failure(e); }
        },
      };

      return chain; // chain methods available immediately
    },
  };
}

module.exports = { installMockGoogleScript };
