// ===============================
// FILE: code/ui/test/raw/support/setupMock.ts
// ===============================
type MockConfig = {
  mapsApiKey?: string;
  sheets?: Record<string, string[]>; // sheetName -> headers[]
};

export function setupMock(window: any) {
  const config: MockConfig = window.__MOCK_CONFIG__ ?? {};

  const getSheetNames = () =>
    Object.keys(config.sheets ?? { Sheet1: [], Sheet2: [], Sheet3: [] });

  const getHeadersFor = (sheetName: string): string[] =>
    (config.sheets && config.sheets[sheetName]) ? config.sheets[sheetName] : [];

  // Prefill Maps API key if provided
  try {
    const input = window.document?.getElementById?.("mapsApiKey") as HTMLInputElement | null;
    if (input && typeof config.mapsApiKey === "string") {
      input.value = config.mapsApiKey;
    }
  } catch {
    // ignore DOM access errors
  }

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
                chain._success(getSheetNames());
              } catch (e) {
                chain._failure(e);
              }
            },

            getHeadersForSheet(sheetName: string) {
              console.log("📡 Mock getHeadersForSheet called with:", sheetName);
              const headers = getHeadersFor(sheetName);
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

          return chain;
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

