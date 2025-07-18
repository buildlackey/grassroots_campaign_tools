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
  const headers = headersRaw.map(h => h.toString().trim().toLowerCase());

  function fuzzyFind(headers, options) {
    for (let i = 0; i < headers.length; i++) {
      if (options.includes(headers[i])) return i;
    }
    return -1;
  }

  const latCol = fuzzyFind(headers, ["lat", "latitude"]);
  const longCol = fuzzyFind(headers, ["long", "lng", "lon", "longitude"]);

  if (latCol === -1 || longCol === -1) {
    const msg = "❌ Could not detect 'lat' or 'long' columns.\n" +
                "Make sure your sheet has columns like 'lat', 'lng', or 'longitude'.\n\n" +
                "Headers found: " + JSON.stringify(headersRaw);
    SpreadsheetApp.getUi().alert(msg);
    return;
  }

  // Attempt to find address column
  let addressCol = headers.findIndex(h => h.includes("address"));

  if (addressCol === -1) {
    const ui = SpreadsheetApp.getUi();
    const res = ui.prompt(
      "Which column contains the address?\n" +
      "• Type a column letter (A, B, C…)\n" +
      "  – or –\n" +
      "• Type the exact header name (e.g. address1, addr, street)"
    );
    if (res.getSelectedButton() !== ui.Button.OK) return;

    const input = res.getResponseText().trim();

    if (/^[A-Za-z]$/.test(input)) {
      addressCol = input.toUpperCase().charCodeAt(0) - 65;
    } else {
      addressCol = headers.findIndex(h => h === input.toLowerCase());
    }

    // 🔧 Fixed error handling — show original input if invalid
    if (addressCol < 0 || addressCol >= headers.length || !headersRaw[addressCol]) {
      SpreadsheetApp.getUi().alert(
        `❌ Address column not found for input: '${input}'\n` +
        "Headers available: " + headersRaw.join(", ")
      );
      return;
    }
  }

  function isValidNumber(n) {
    return typeof n === 'number' && !isNaN(n);
  }

  let updatedCount = 0;

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    const address = row[addressCol];
    const lat = row[latCol];
    const lng = row[longCol];

    if (!address || (isValidNumber(lat) && isValidNumber(lng))) continue;

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
        Utilities.sleep(100); // polite API delay
      } else {
        Logger.log(`⚠️ Geocoding failed at row ${i + 1}: ${json.status}`);
      }
    } catch (e) {
      Logger.log(`❌ Error at row ${i + 1}: ${e.message}`);
    }
  }

  SpreadsheetApp.getUi().alert(`✅ Finished. ${updatedCount} rows updated with lat/long.`);
}


