global.google = {
  script: {
    run: {
      withSuccessHandler(successHandler) {
        return {
          withFailureHandler(failureHandler) {
            return {
              getHeadersForSheet(sheetName) {
                console.log("📡 Mock getHeadersForSheet called with:", sheetName);
                const headers = global.window?.__MOCK_CONFIG__?.sheets?.[sheetName] ?? [];
                successHandler({ headers });
              },
              getSheetTabNames() {
                console.log("📡 Mock getSheetTabNames called");
                const tabNames = Object.keys(global.window?.__MOCK_CONFIG__?.sheets || {});
                successHandler(tabNames);
              },
              savePreferences(prefs) {
                console.log("💾 Saved preferences", prefs);
                successHandler();
              }
            };
          }
        };
      }
    },
    host: {
      close: () => console.log("🔒 Dialog closed"),
    }
  }
};

