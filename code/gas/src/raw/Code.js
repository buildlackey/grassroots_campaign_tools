function include(filename) {
    Logger.log("📥 [Code.js/include] filename=%s", filename);
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function onOpen() {
    Logger.log("🚪 [Code.js/onOpen] ENTER");
    SpreadsheetApp.getUi()
        .createMenu('📣 Campaign')  // bullhorn icon
        .addItem('⚙️ Settings', 'showSettingsDialog')
        .addItem('🌎 Distance Filter', 'showFilterDialog')  // was placeholderFilterDistance
        .addToUi();
    Logger.log("🚪 [Code.js/onOpen] EXIT");
}


function showFilterDialog() {
    Logger.log("🪟 [Code.js/showFilterDialog] ENTER");
    var html = HtmlService
        .createTemplateFromFile('FilterDialog')
        .evaluate()
        .setWidth(420)
        .setHeight(410);
    SpreadsheetApp.getUi().showModalDialog(html, ' ');
    Logger.log("🪟 [Code.js/showFilterDialog] EXIT");
}


function showSettingsDialog() {
    Logger.log("🪟 [Code.js/showSettingsDialog] ENTER");
    var html = HtmlService
        .createTemplateFromFile('SettingsDialog')
        .evaluate()
        .setWidth(420)
        .setHeight(410);
    SpreadsheetApp.getUi().showModalDialog(html, ' ');
    Logger.log("🪟 [Code.js/showSettingsDialog] EXIT");
}

function savePreferences(prefs, columns) {
    Logger.log("📥 [Code.js:savePreferences] called prefs=%s columns=%s",
               JSON.stringify(prefs), JSON.stringify(columns));

    if (globalThis.CAMPAIGN_TOOLS && globalThis.CAMPAIGN_TOOLS.PreferenceSvc) {
        const result = globalThis.CAMPAIGN_TOOLS.PreferenceSvc.create().savePreferences(prefs, columns);
        Logger.log("🔔 [Code.js:savePreferences] about to toast");
        SpreadsheetApp.getActiveSpreadsheet().toast("✅ Settings saved", "Campaign Tools", 3);
        Logger.log("✅ [Code.js:savePreferences] completed");
        return result;
    }
    Logger.log("❌ [Code.js:savePreferences] PreferenceSvc unavailable");
    throw new Error("PreferenceSvc unavailable in runtime");
}

/**
 * Smoke Test
 *
 * Validates that the deployed bundle is wired correctly inside the GAS runtime.
 *
 * <p>By the time this function runs, the entire script project has already been
 * parsed and compiled by Apps Script. This means:</p>
 * <ul>
 *   <li>Syntax errors anywhere in the codebase would already have blocked deployment,
 *       so this test does not serve as a syntax checker.</li>
 *   <li>Instead, this smoke test focuses on catching issues that only manifest at runtime.</li>
 * </ul>
 *
 * <p>Specifically, it can reveal:</p>
 * <ul>
 *   <li><b>Runtime linkage errors</b> — for example, if a namespace or global export
 *       wasn’t attached correctly (e.g. <code>globalThis.CAMPAIGN_TOOLS.PreferenceSvc</code>
 *       is undefined).</li>
 *   <li><b>Transpilation/packaging surprises</b> — if the bundler emitted code that
 *       Apps Script accepts syntactically but fails to execute at runtime.</li>
 *   <li><b>Environment mismatches</b> — code that passes in Node/Jest tests but fails
 *       under the V8 Apps Script runtime due to subtle differences.</li>
 * </ul>
 *
 * <p>In short, this function confirms that the deployed build is callable in
 * the target environment and that critical globals are accessible.</p>
 *
 * @return {string} "SUCCESS" token to indicate the bundle is alive.
 */
function smokeTest() {
    Logger.log("🧪 [Code.js/smokeTest] ENTER");
    if (!globalThis.CAMPAIGN_TOOLS || !globalThis.CAMPAIGN_TOOLS.PreferenceSvc) {
        throw new Error("Bundle not loaded: PreferenceSvc is missing from CAMPAIGN_TOOLS");
    }

    var svc = globalThis.CAMPAIGN_TOOLS.PreferenceSvc.create();

    var key = "TEST_KEY_" + Math.random().toString(36).slice(2);
    svc.clearPreferences({ document: false, user: true });
    svc.savePreferences({ mapsApiKey: key }, []);
    var prefs = svc.getPreferences();

    if (prefs.mapsApiKey !== key) {
        throw new Error("PreferenceSvc failed: expected " + key + ", got " + prefs.mapsApiKey);
    }

    // real API key is injected by push script
    svc.savePreferences({ mapsApiKey: "GOOGLE_MAPS_API_KEY"}, []);
    // The real API key will be dynamically injected by our push to workspace script (since we don't want this in git)
    Logger.log("🧪 [Code.js/smokeTest] EXIT success");


    return "INTEGRATION SUCCESS";
}

function verifyMapsApiKeySaved() {
    if (globalThis.CAMPAIGN_TOOLS && globalThis.CAMPAIGN_TOOLS.PreferenceSvc) {
        var svc = globalThis.CAMPAIGN_TOOLS.PreferenceSvc.create();
        var prefs = svc.getPreferences();
        var msg = prefs && prefs.mapsApiKey
            ? "✅ Maps API key stored: " + prefs.mapsApiKey
            : "❌ No Maps API key found in user properties.";
        return msg;
    }
    throw new Error("PreferenceSvc unavailable in runtime");
}

function showToastInSheets(msg) {
    Logger.log("🔔 [Code.js/showToastInSheets] %s", msg);
    SpreadsheetApp.getActiveSpreadsheet().toast(msg, "Campaign Tools", 3);
}


function getInitData() {
    const svc = globalThis.CAMPAIGN_TOOLS.PreferenceSvc.create();
    const prefs = svc.getPreferences();

    const model = globalThis.CAMPAIGN_TOOLS.CampaignToolsModel.fromGAS(prefs);
    return model.getModelState();
}

function logicPing() {
  if (!globalThis.CAMPAIGN_TOOLS || !globalThis.CAMPAIGN_TOOLS.HelloSvc) {
    throw new Error("HelloSvc not found");
  }
  return globalThis.CAMPAIGN_TOOLS.HelloSvc.ping();
}
