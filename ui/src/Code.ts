import { populateLatLong } from "./Geocoder";

export function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📍 Kanga bigaroo")
    .addItem("Test Item", "testFunction")
    .addItem("Add Lat/Long Info", "populateLatLong")
    .addToUi();
}

export function testFunction() {
  SpreadsheetApp.getUi().alert("Test function triggered!");
}


export function smokeTest(): string {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty("GOOGLE_MAPS_API_KEY");
  const debug = props.getProperty("DEBUG");

  if (!apiKey) throw new Error("Missing GOOGLE_MAPS_API_KEY");
  if (debug !== "false") throw new Error(`Unexpected DEBUG value: ${debug}`);

  return "SUCCESS";
}


export function hello(): string {
  return "HELLO4";
}

export function initSetup(): string {
  const props: GoogleAppsScript.Properties.Properties = PropertiesService.getScriptProperties();
  const existingKey: string | null = props.getProperty("GOOGLE_MAPS_API_KEY");

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



export { populateLatLong };
