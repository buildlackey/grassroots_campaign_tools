// Minimal Google Apps Script mock for manual browser-based testing
// UMD-ish so it works in Node/Jest (CommonJS) and in a browser <script>
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory(); // CommonJS (Jest)
    } else {
        var api = factory();
        root.setupMock = api.setupMock; // Browser global
    }
}(typeof self !== "undefined" ? self : this, function () {

    function setupMock(win) {
        // ✅ Built-in default dataset for manual browser usage
        const sheets = { Sheet1: ["someColumnHeader"], Sheet2: ["altAddr"], Sheet3: [] };
        const names = Object.keys(sheets);

        win.google = {
            script: {
                run: {
                    withSuccessHandler: function (successHandler) {
                        const chain = {
                            withFailureHandler: function (_fh) { return chain; },
                            getInitData: function () {
                                try {
                                    successHandler({
                                        sheetTabNames: names,
                                        sheetTabToColumnNames: sheets,
                                        prefs: {
                                            mapsApiKey: "mockKey123",   // non-empty by default
                                            sheetTabName: names[0],     // "Sheet1"
                                            addressColumn: sheets[names[0]][0] || "",
                                            showLatLong: false,
                                            debug: false,
                                        }
                                    });
                                } catch (e) {
                                    console.error("Mock failure:", e);
                                }
                            },
                            savePreferences: function (prefs) {
                                try {
                                    console.log("💾 Saved preferences", prefs);
                                    successHandler();
                                } catch (e) {
                                    console.error("Mock failure:", e);
                                }
                            }
                        };
                        return chain;
                    }
                }
            },
            host: {
                close: function () { console.log("🔒 Dialog closed"); }
            }
        };
    }

    return { setupMock: setupMock };
}));
