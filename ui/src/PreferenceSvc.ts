export interface Preferences {
  sheetName: string;
  addressColumn: string;
  mapsApiKey: string;
  showLatLong: boolean;
  debug: boolean;
}

export function showSettingsDialog(): void {
  Logger.log("🧩 Rendering HTML settings dialog...");
  const html = HtmlService.createHtmlOutputFromFile("SettingsDialog")
    .setWidth(580)
    .setHeight(460);
  SpreadsheetApp.getUi().showModalDialog(html, "Setup Preferences");
}

export function getInitialPrefs(): Partial<Preferences> {
  Logger.log("🔍 Checking for existing Maps API key...");
  const userProps = PropertiesService.getUserProperties();
  const key = userProps.getProperty("GOOGLE_MAPS_API_KEY");
  return key ? { mapsApiKey: key } : {};
}

export function getSheetTabNames(): string[] {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  const names = sheets.map((s) => s.getName());
  Logger.log("📑 Sheet tabs discovered: " + names.join(", "));
  return names;
}

export function getHeadersForSheet(sheetName: string): { headers: string[] } {
  Logger.log("🔎 Fetching headers for sheet: " + sheetName);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    Logger.log("❌ Sheet not found: " + sheetName);
    throw new Error("Sheet not found");
  }
  const values = sheet.getDataRange().getValues();
  const headers = values.length > 0 ? (values[0] as string[]) : [];
  Logger.log("📌 Headers for '" + sheetName + "': " + headers.join(", "));
  return { headers };
}

export function saveUserPreferences(prefs: Preferences): void {
  Logger.log("💾 Saving user preferences: " + JSON.stringify(prefs));
  const scriptProps = PropertiesService.getScriptProperties();
  const userProps = PropertiesService.getUserProperties();
  scriptProps.setProperty("SHEET_NAME", prefs.sheetName);
  scriptProps.setProperty("ADDRESS_COLUMN", prefs.addressColumn);
  scriptProps.setProperty("SHOW_LAT_LONG", String(prefs.showLatLong));
  userProps.setProperty("DEBUG", String(prefs.debug));
  userProps.setProperty("GOOGLE_MAPS_API_KEY", prefs.mapsApiKey);
  Logger.log("✅ Preferences saved.");
}

export class PreferenceSvc {
  private userProps = PropertiesService.getUserProperties();

  getMapsApiKey(): string | null {
    return this.userProps.getProperty("GOOGLE_MAPS_API_KEY");
  }
}

