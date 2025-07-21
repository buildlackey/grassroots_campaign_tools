import { populateLatLong } from "./Geocoder";

export function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📍 Pest Fenu")
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




export { populateLatLong };
