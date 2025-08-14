// TODO - comment/explain how this is used for browser based testing
// code/ui/test/raw/setupMock.js
// UMD-ish so it works in Node/Jest (CommonJS) and in a browser <script>
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();                 // CommonJS (Jest)
  } else {
    var api = factory();
    root.setupMock = api.setupMock;             // Browser global
  }
}(typeof self !== "undefined" ? self : this, function () {

  function setupMock(win) {
    var config = (win && win.__MOCK_CONFIG__) || {};

    // Prefill Maps key if present
    try {
      var input = win.document && win.document.getElementById && win.document.getElementById("mapsApiKey");
      if (input && typeof config.mapsApiKey === "string") input.value = config.mapsApiKey;
    } catch (_) {}

    win.google = {
      script: {
        run: {
          withSuccessHandler: function (successHandler) {
            var chain = {
              _success: successHandler,
              _failure: function (e) { console.error("Mock failure:", e); },

              withFailureHandler: function (fh) {
                chain._failure = fh;
                return chain;
              },

              getSheetTabsAndColumnNames: function () {
                try {
                  var sheets = config.sheets || { Sheet1: [], Sheet2: [], Sheet3: [] };
                  var names = Object.keys(sheets);
                  chain._success({
                    sheetTabNames: names,
                    sheetTabToColumnNames: sheets
                  });
                } catch (e) { chain._failure(e); }
              },

              savePreferences: function (prefs) {
                try { console.log("💾 Saved preferences", prefs); chain._success(); } catch (e) { chain._failure(e); }
              }
            };
            return chain;
          }
        },
        host: {
          close: function () { console.log("🔒 Dialog closed"); }
        }
      }
    };
  }

  return { setupMock: setupMock };
}));
