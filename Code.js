

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("📍 Pro Tools")
    .addItem("...Test API Key", "testApiKeyAccess")
    .addItem("Add Lat/Long Info", "populateLatLong")
    .addItem("Filter by Distance", "filterByDistance")


    .addToUi();
}



function getMapsApiKey() {
  return PropertiesService.getScriptProperties().getProperty("GOOGLE_MAPS_API_KEY");
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
