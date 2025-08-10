// ===============================
// FILE: code/ui/test/raw/support/installMockGoogleScript.ts
// ===============================
export function installMockGoogleScript(window: any) {

  window.google = {
    script: {
      run: {
        withSuccessHandler(successHandler: Function) {
          const chain: any = {
            _success: successHandler,
            _failure: (e: any) => console.error("Mock failure:", e),

            withFailureHandler(fh: Function) {
              chain._failure = fh;
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
              const headers = sheetName === "Sheet2" ? ["Name", "address1"] : [];
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

          return chain; // methods available immediately (like GAS proxy)
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

