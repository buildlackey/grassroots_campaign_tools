declare const google: any;  // GAS runtime

let sheets: string[] = [];
let headers: string[] = [];

window.addEventListener("load", onOpen);

function onOpen(): void {
  console.log("🔍 Fetching sheet tabs...");
  google.script.run.withSuccessHandler((sheetNames: string[]) => {
    const sheetSelect = document.getElementById("sheetSelect") as HTMLSelectElement;
    sheets = sheetNames;
    sheetSelect.innerHTML = sheets.map((name: string) =>
      `<option value="${name}">${name}</option>`).join('');
    if (sheets.length > 0) {
      sheetSelect.value = sheets[0];
      onSheetChange(); // auto-load address columns
    }
  }).getSheetTabNames();
}

function onSheetChange(): void {
  const sheetName = (document.getElementById("sheetSelect") as HTMLSelectElement).value;
  console.log("📄 onSheetChange called with:", sheetName);
  google.script.run
    .withSuccessHandler((result: { headers: string[] }) => {
      console.log("📥 Headers returned from GAS:", result);
      const addressSelect = document.getElementById("addressSelect") as HTMLSelectElement;
      headers = result.headers || [];
      console.log("📑 Headers extracted:", headers);
      addressSelect.innerHTML = headers.map((h: string) =>
        `<option value="${h}">${h}</option>`).join('');
      const defaultAddr = headers.find((h: string) => /address/i.test(h));
      if (defaultAddr) {
        addressSelect.value = defaultAddr;
        console.log("✅ Default address column preselected:", defaultAddr);
      } else {
        console.warn("⚠️ No obvious address-like column found.");
      }
    })
    .withFailureHandler((e: Error) => {
      console.error("❌ GAS call failed:", e);
    })
    .getHeadersForSheet(sheetName);
}

function toggleApiKeyVisibility(checkbox: HTMLInputElement): void {
  const field = document.getElementById("mapsApiKey") as HTMLInputElement;
  field.type = checkbox.checked ? "text" : "password";
}

function hideApiKeyOnBlur(): void {
  const field = document.getElementById("mapsApiKey") as HTMLInputElement;
  field.type = "password";
}

function cancelDialog(): void {
  google.script.host.close();
}

function saveSettings(): void {
  const sheet = (document.getElementById("sheetSelect") as HTMLSelectElement).value;
  const addressCol = (document.getElementById("addressSelect") as HTMLSelectElement).value;
  const apiKey = (document.getElementById("mapsApiKey") as HTMLInputElement).value;
  const showLatLng = (document.getElementById("showLatLng") as HTMLInputElement).checked;
  const debug = (document.getElementById("debug") as HTMLInputElement).checked;

  if (!addressCol) {
    showHelp("addressColumn", window.event as Event);
    return;
  }

  google.script.run
    .withSuccessHandler(() => {
      console.log("✅ Preferences saved, closing dialog...");
      google.script.host.close();
    })
    .withFailureHandler((e: Error) => {
      console.error("❌ Failed to save preferences:", e);
      alert("Save failed: " + e.message);
    })
    .savePreferences({
      sheetName: sheet,
      addressColumn: addressCol,
      mapsApiKey: apiKey,
      showLatLong: showLatLng,
      debug: debug,
    });
}

function showHelp(topic: string, event: Event): void {
  console.log("🆘 Help icon clicked for topic:", topic, event);
  const messages: Record<string, string> = {
    mapsApiKey: `Enter your Google Maps API key. You can obtain this from the Google Cloud Console. Make sure the Maps JavaScript API is enabled.`,
    sheetTab: `Select the sheet where your data is stored.`,
    addressColumn: `Choose the column in your sheet that contains addresses.`,
    showLatLng: `Check this box to display the Latitude and Longitude results in your sheet.`,
    debug: `Enable this to log detailed debugging information for troubleshooting.`,
  };
  alert(messages[topic] || "No help available for this section.");
}

