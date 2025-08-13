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
export function installMockGoogleScript(window) {
  window.google = {
    script: {
      run: {
        withSuccessHandler(successCallback) {
          return {
            withFailureHandler(failureCallback) {
              return {
                /**
                 * Mock GAS: getSheetTabsAndColumnNames
                 * Static data for manual UI testing
                 */
                getSheetTabsAndColumnNames() {
                  console.log("📄 Static mock getSheetTabsAndColumnNames called");

                  const sheetTabNames = ["Sheet1", "Sheet2", "Sheet3"];
                  const sheetTabToColumnNames = {
                    Sheet1: [],
                    Sheet2: ["Name", "Address", "Phone"], // Old mock preserved here
                    Sheet3: []
                  };

                  successCallback({
                    sheetTabNames,
                    sheetTabToColumnNames
                  });
                }
              };
            }
          };
        }
      }
    }
  };
}
