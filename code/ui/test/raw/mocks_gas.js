export function installMockGoogleScript(window: any) {
  window.google = {
    script: {
      run: {
        withSuccessHandler(successHandler: Function) {
          return {
            withFailureHandler(failureHandler: Function) {
              return {
                getSheetTabNames() {
                  console.log("📡 Mock getSheetTabNames called");
                  successHandler(["Sheet1", "Sheet2", "Sheet3"]);
                },
                getHeadersForSheet(sheetName: string) {
                  console.log("📡 Mock getHeadersForSheet called with:", sheetName);
                  const headers = sheetName === "Sheet2"
                    ? ["Name", "Address"]
                    : [];
                  successHandler({ headers });
                },
                savePreferences(prefs: Record<string, any>) {
                  console.log("💾 Saved preferences", prefs);
                  successHandler(); // simulate success
                }
              };
            }
          };
        }
      },
      host: {
        close() {
          console.log("🔒 Dialog closed");
        }
      }
    }
  };
}

