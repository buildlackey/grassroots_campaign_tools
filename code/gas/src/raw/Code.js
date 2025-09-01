function include(filename) {
    Logger.log("📥 [Code.js/include] filename=%s", filename);
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function onOpen() {
    Logger.log("🚪 [Code.js/onOpen] ENTER");
    SpreadsheetApp.getUi()
        .createMenu('📣 Campaign')  // bullhorn icon
        .addItem('⚙️ Settings', 'showSettingsDialog')
        .addToUi();
    Logger.log("🚪 [Code.js/onOpen] EXIT");
}

function showSettingsDialog() {
    Logger.log("🪟 [Code.js/showSettingsDialog] ENTER");
    var html = HtmlService
        .createTemplateFromFile('SettingsDialog')
        .evaluate()
        .setTitle('⚙️ Settings')
        .setWidth(420)
        .setHeight(410);
    SpreadsheetApp.getUi().showModalDialog(html, 'Settings');
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
    var svc = globalThis.CAMPAIGN_TOOLS.PreferenceSvc.create();
    var prefs = svc.getPreferences();

    var tabsAndColumnNames = getSheetTabsAndColumnNames();

    return {
        sheetTabNames: tabsAndColumnNames.sheetTabNames,
        sheetTabToColumnNames: tabsAndColumnNames.sheetTabToColumnNames,
        prefs: prefs,
    };
}

