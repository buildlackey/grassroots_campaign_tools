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

export { populateLatLong }; // ✅ Make available to GAS via gas-webpack-plugin
