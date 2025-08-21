function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('📍 Campaign Figs')
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

function smokeTest() {
    if (!globalThis.GASMOD || typeof globalThis.GASMOD.runIntegrationTest !== "function") {
        throw new Error("Bundle not loaded: GASMOD.runIntegrationTest is missing");
    }
    return globalThis.GASMOD.runIntegrationTest();
}
