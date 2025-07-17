function hayHello(): void {
  const name = Session.getActiveUser().getEmail().split("@")[0];
  SpreadsheetApp.getActiveSpreadsheet().toast(`Yo...Hello, ${name}! 👋`, "Greeting");
}

function onOpen(
  _e:
    | GoogleAppsScript.Events.DocsOnOpen
    | GoogleAppsScript.Events.SlidesOnOpen
    | GoogleAppsScript.Events.SheetsOnOpen
    | GoogleAppsScript.Events.FormsOnOpen,
): void {
  SpreadsheetApp.getUi()
    .createMenu("🔧 Example Menu")
    .addItem("May Hello", "hayHello")
    .addToUi();
}

function onEdit(_e: GoogleAppsScript.Events.SheetsOnEdit): void {
  console.log(_e);
}

function onInstall(_e: GoogleAppsScript.Events.AddonOnInstall): void {
  console.log(_e);
}

function doGet(_e: GoogleAppsScript.Events.DoGet): void {
  console.log(_e);
}

function doPost(_e: GoogleAppsScript.Events.DoPost): void {
  console.log(_e);
}

export { onOpen, onEdit, onInstall, doGet, doPost, hayHello };

