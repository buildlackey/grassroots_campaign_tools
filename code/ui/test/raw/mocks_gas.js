export function installMockGoogleScript(window: any) {
  window.google = {
    script: {
      run: {
        withSuccessHandler(successHandler: Function) {
          // shared chain object that mimics GAS' proxy
          const chain: any = {
            _success: successHandler,
            _failure: (e: any) => console.error("Mock failure:", e),

            withFailureHandler(failureHandler: Function) {
              chain._failure = failureHandler;
              return chain;
            },

            getSheetTabNames() {
              console.log("📡 Mock getSheetTabNames called");
              try {
                chain._success(["Sheet1", "Sheet2", "Sheet3"]);
              } catch (e) {
                chain._failure(e);
              }
            },

            getHeadersForSheet(sheetName: string) {
              console.log("📡 Mock getHeadersForSheet called with:", sheetName);
              const headers = sheetName === "Sheet2" ? ["Name", "Address"] : [];
              try {
                chain._success({ headers });
              } catch (e) {
                chain._failure(e);
              }
            },

            savePreferences(prefs: Record<string, any>) {
              console.log("💾 Saved preferences", prefs);
              try {
                chain._success(); // simulate success
              } catch (e) {
                chain._failure(e);
              }
            },
          };

          return chain; // methods are available immediately
        },
      },

      host: {
        close() {
          console.log("🔒 Dialog closed");
        },
      },
    },
  };
}

