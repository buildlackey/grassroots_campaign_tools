function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function showPreferencesDialog() {
  const template = HtmlService.createTemplateFromFile('SettingsDialog');
  SpreadsheetApp.getUi().showModalDialog(template.evaluate(), 'Preferences');
}

//  This set-up lets us remote invoke the function as a smoke test -- even if there was no explicit deployment
globalThis.initSetup = function () {
  const props = PropertiesService.getScriptProperties();
  const existingKey = props.getProperty("GOOGLE_MAPS_API_KEY");

  if (existingKey) {
    Logger.log("⚠️ Script properties already set. Skipping initialization.");
    return "INIT_SKIPPED";
  }
    
  const key = "$MAPS_API_KEY"; // Replace with real key or inject at build time
  props.setProperty("GOOGLE_MAPS_API_KEY", key);
  props.setProperty("DEBUG", "false");
  props.setProperty("YEBUG", "cat");
  
  Logger.log("✅ Script properties initialized.");
  return "INIT_DONE";
} 



function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧪 pest UI')
    .addItem('1funcall ', 'funcall')        
    .addItem('1sideBarTest ', 'sideBarTest')        
    .addItem('1dialogTest', 'dialogTest')        // createTemplateFromFile
    .addToUi();
}

function createHtmlOutput() {
  const html = HtmlService.createHtmlOutput("<p>Hello from Modal</p>").setWidth(300).setHeight(100);
  SpreadsheetApp.getUi().showSidebar(html);
}

function whoAmI() {
  alert(Session.getActiveUser().getEmail());
}


function sideBarTest() {
  const html = HtmlService
    .createTemplateFromFile('SettingsDialog')
    .evaluate()
    .setTitle('⚙️ Settings Sidebar'); 

  SpreadsheetApp.getUi().showSidebar(html);
}


function dialogTest() {
  const html = HtmlService
    .createTemplateFromFile('SettingsDialog')
    .evaluate()
    .setTitle('⚙️ Settings Sidebar');  
  SpreadsheetApp.getUi().showModalDialog(html, "🚧 the Dialog");
}



