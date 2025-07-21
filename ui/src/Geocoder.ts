import { PreferenceSvc } from "./PreferenceSvc";



export function populateLatLong(prefs?: PreferenceSvc) : void {
  prefs = prefs || new PreferenceSvc();

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const apiKey = prefs.getMapsApiKey();
  if (!apiKey) {
    SpreadsheetApp.getUi().alert("❌ API key not found in script properties.");
    return;
  }

  const data = sheet.getDataRange().getValues();

  const headerRowIndex = data.findIndex(row =>
    row.some(cell => cell.toString().trim() !== "")
  );

  if (headerRowIndex === -1) {
    SpreadsheetApp.getUi().alert("❌ No header row found.");
    return;
  }

  const header = data[headerRowIndex];
  let latCol = header.indexOf("Latitude");
  let lngCol = header.indexOf("Longitude");

  if (latCol === -1) {
    latCol = header.length;
    sheet.getRange(headerRowIndex + 1, latCol + 1).setValue("Latitude");
  }

  if (lngCol === -1) {
    lngCol = header.length + (latCol === header.length ? 1 : 0);
    sheet.getRange(headerRowIndex + 1, lngCol + 1).setValue("Longitude");
  }

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const address = data[i][0];
    if (!address) continue;

    const response = UrlFetchApp.fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    const json = JSON.parse(response.getContentText());

    if (json.status === "OK") {
      const location = json.results[0].geometry.location;
      sheet.getRange(i + 1, latCol + 1).setValue(location.lat);
      sheet.getRange(i + 1, lngCol + 1).setValue(location.lng);
    } else {
      sheet.getRange(i + 1, latCol + 1).setValue("❌");
      sheet.getRange(i + 1, lngCol + 1).setValue("❌");
    }
  }

  SpreadsheetApp.getUi().alert("✅ Lat/Long population complete.");
}

