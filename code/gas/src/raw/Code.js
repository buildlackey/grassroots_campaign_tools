function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('📍 Campaign Tools')
        .addItem('Open Settings', 'showSettingsDialog')
        .addToUi();
}

function showSettingsDialog() {
    var html = HtmlService
        .createTemplateFromFile('SettingsDialog')
        .evaluate()
        .setTitle('⚙️ Settings')
        .setWidth(380)
        .setHeight(400);
    SpreadsheetApp.getUi().showModalDialog(html, 'Settings');
}
function savePreferences(prefs, columns) {
    if (globalThis.CAMPAIGN_TOOLS && globalThis.CAMPAIGN_TOOLS.PreferenceSvc) {
        return globalThis.CAMPAIGN_TOOLS.PreferenceSvc.forGAS().savePreferences(prefs, columns);
    }
    throw new Error("PreferenceSvc unavailable in runtime");
}

function smokeTest() {
    if (!globalThis.CAMPAIGN_TOOLS || !globalThis.CAMPAIGN_TOOLS.PreferenceSvc) {
        throw new Error("Bundle not loaded: PreferenceSvc is missing from CAMPAIGN_TOOLS");
    }

    var svc = globalThis.CAMPAIGN_TOOLS.PreferenceSvc.forGAS();

    var key = "TEST_KEY_" + Math.random().toString(36).slice(2);
    svc.clearPreferences({ document: false, user: true });
    svc.savePreferences({ mapsApiKey: key }, []);
    var prefs = svc.getPreferences();

    if (prefs.mapsApiKey !== key) {
        throw new Error("PreferenceSvc failed: expected " + key + ", got " + prefs.mapsApiKey);
    }



    // The real API key will be dynamically injected by our push to workspace script (since we don't want this in git)
    svc.savePreferences({ mapsApiKey: "GOOGLE_MAPS_API_KEY"}, []);


    return "INTEGRATION SUCCESS";
}


function verifyMapsApiKeySaved() {
    if (globalThis.CAMPAIGN_TOOLS && globalThis.CAMPAIGN_TOOLS.PreferenceSvc) {
        var svc = globalThis.CAMPAIGN_TOOLS.PreferenceSvc.forGAS();
        var prefs = svc.getPreferences();
        return prefs && prefs.mapsApiKey
            ? "✅ Maps API key stored: " + prefs.mapsApiKey
            : "❌ No Maps API key found in user properties.";
    }
    throw new Error("PreferenceSvc unavailable in runtime");
}

