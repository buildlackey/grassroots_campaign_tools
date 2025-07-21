import { populateLatLong } from "./Geocoder";

export function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📍 Test Menu")
    .addItem("Test Item", "testFunction")
    .addItem("Add Lat/Long Info", "populateLatLong")
    .addToUi();
}

export function testFunction() {
  SpreadsheetApp.getUi().alert("Test function triggered!");
}

// (globalThis as any).populateLatLong = populateLatLong; // tried this does not work

export { populateLatLong };

