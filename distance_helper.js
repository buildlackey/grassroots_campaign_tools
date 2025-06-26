function populateLatLong() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const apiKey = PropertiesService.getScriptProperties().getProperty("GOOGLE_MAPS_API_KEY");
  if (!apiKey) {
    SpreadsheetApp.getUi().alert("❌ API key not found in script properties.");
    return;
  }

  const data = sheet.getDataRange().getValues();

  // Find first non-empty row to use as header
  let headerRowIndex = data.findIndex(row => row.some(cell => cell.toString().trim() !== ""));
  if (headerRowIndex === -1) {
    SpreadsheetApp.getUi().alert("❌ No non-empty header row found.");
    return;
  }
  const headersRaw = data[headerRowIndex];

  Logger.log("🧠 Raw headers: " + JSON.stringify(headersRaw));

  const headers = headersRaw.map(h => h.toString().trim().toLowerCase());
  Logger.log("🔍 Normalized headers: " + JSON.stringify(headers));

  function fuzzyFind(headers, options) {
    for (let i = 0; i < headers.length; i++) {
      if (options.includes(headers[i])) return i;
    }
    return -1;
  }

  Logger.log("🔎 Looking for lat/lng columns...");
  const latCol = fuzzyFind(headers, ["lat", "latitude"]);
  const longCol = fuzzyFind(headers, ["long", "lng", "lon", "longitude"]);

  if (latCol === -1 || longCol === -1) {
    const msg = "❌ Could not detect 'lat' or 'long' columns.\n" +
                "Make sure your sheet has columns like 'lat', 'lng', or 'longitude'.\n\n" +
                "Headers found: " + JSON.stringify(headersRaw);
    SpreadsheetApp.getUi().alert(msg);
    return;
  }

  let addressCol = headers.findIndex(h => h.includes("address"));
  if (addressCol === -1) {
    const response = SpreadsheetApp.getUi().prompt("Which column contains the address? (e.g., A, B, C...)");
    const letter = response.getResponseText().trim().toUpperCase();
    addressCol = letter.charCodeAt(0) - 65;
  }

  if (addressCol < 0 || addressCol >= headers.length) {
    SpreadsheetApp.getUi().alert("❌ Invalid address column selected.");
    return;
  }

  let updatedCount = 0;

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    const address = row[addressCol];
    const lat = row[latCol];
    const lng = row[longCol];

    if (!address || (lat && lng)) continue;

    const geoUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" +
      encodeURIComponent(address) + "&key=" + apiKey;

    try {
      const response = UrlFetchApp.fetch(geoUrl);
      const json = JSON.parse(response.getContentText());

      if (json.status === "OK") {
        const loc = json.results[0].geometry.location;
        sheet.getRange(i + 1, latCol + 1).setValue(loc.lat);
        sheet.getRange(i + 1, longCol + 1).setValue(loc.lng);
        updatedCount++;
        Utilities.sleep(200); // be polite to the API
      } else {
        Logger.log(`⚠️ Geocoding failed at row ${i + 1}: ${json.status}`);
      }
    } catch (e) {
      Logger.log(`❌ Error at row ${i + 1}: ${e.message}`);
    }
  }

  SpreadsheetApp.getUi().alert(`✅ Finished. ${updatedCount} rows updated with lat/long.`);
}



function testApiKeyAccess() {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GOOGLE_MAPS_API_KEY");
  Logger.log("🔎 Loaded API key: " + apiKey);

  if (!apiKey) {
    const ui = SpreadsheetApp.getUi();
    try {
      ui.alert("❌ API key not found in script properties.");
    } catch (e) {
      Logger.log("❌ API key not found — and UI alert failed. Fallback logging only.");
    }
    return;
  }

  const address = "1600 Amphitheatre Parkway, Mountain View, CA";
  const geoUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" +
    encodeURIComponent(address) + "&key=" + apiKey;

  try {
    const response = UrlFetchApp.fetch(geoUrl);
    const json = JSON.parse(response.getContentText());
    Logger.log("📡 API response: " + JSON.stringify(json));

    if (json.status === "OK") {
      const loc = json.results[0].geometry.location;
      const message = "✅ API key works!\nLat: " + loc.lat + "\nLng: " + loc.lng;
      try {
        SpreadsheetApp.getUi().alert(message);
      } catch (e) {
        Logger.log("✅ API success (alert failed): " + message);
      }
    } else {
      const failMsg = "⚠️ API call failed: " + json.status;
      try {
        SpreadsheetApp.getUi().alert(failMsg);
      } catch (e) {
        Logger.log(failMsg);
      }
    }

  } catch (e) {
    Logger.log("💥 Error during fetch: " + e.message);
    try {
      SpreadsheetApp.getUi().alert("💥 Error: " + e.message);
    } catch (e2) {
      Logger.log("💥 Error alert failed: " + e2.message);
    }
  }
}



function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📍 Pro Tools")
    .addItem("Test API Key", "testApiKeyAccess")
    .addItem("Add Lat/Long Info", "populateLatLong")

    .addToUi();
}




