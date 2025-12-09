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
        if (!win.CAMPAIGN) win.CAMPAIGN = {};
        // Mock GAS Logger global for test/browser environments
        if (typeof win.Logger === "undefined") {
            win.Logger = {
                log: function() {
                    console.log("Logger.log called with:", ...arguments);
                    console.log("Stack trace:", new Error().stack);
                }
            };
        }
        // Do not instantiate win.CAMPAIGN.logger here; let dialog code handle it.

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
                                            mapsApiKey: "mockKey123",
                                            sheetTabName: names[0],
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
                                    win.CAMPAIGN.logger.log("💾 Saved preferences", prefs);
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
                close: function () { win.CAMPAIGN.logger.log("🔒 Dialog closed"); }
            }
        };
    }

    return { setupMock: setupMock };
}));
