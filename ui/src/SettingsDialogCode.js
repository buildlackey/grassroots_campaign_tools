
      let sheets = [];
      let headers = [];

      window.addEventListener("load", onOpen);

      function onOpen() {
        console.log("🔍 Fetching sheet tabs...");
        google.script.run.withSuccessHandler((sheetNames) => {
          const sheetSelect = document.getElementById("sheetSelect");
          sheets = sheetNames;
          sheetSelect.innerHTML = sheets.map(name =>
            `<option value="${name}">${name}</option>`).join('');
          if (sheets.length > 0) {
            sheetSelect.value = sheets[0];
            onSheetChange(); // auto-load address columns
          }
        }).getSheetTabNames();
      }

    function onSheetChange() {
      const sheetName = document.getElementById("sheetSelect").value;
      console.log("📄 onSheetChange called with:", sheetName);
      google.script.run
        .withSuccessHandler((result) => {
          console.log("📥 Headers returned from GAS:", result);
          const addressSelect = document.getElementById("addressSelect");
          headers = result.headers || [];
          console.log("📑 Headers extracted:", headers);
          addressSelect.innerHTML = headers.map(h =>
            `<option value="${h}">${h}</option>`).join('');
          const defaultAddr = headers.find(h => /address/i.test(h));
          if (defaultAddr) {
            addressSelect.value = defaultAddr;
            console.log("✅ Default address column preselected:", defaultAddr);
          } else {
            console.warn("⚠️ No obvious address-like column found.");
          }
        })
        .withFailureHandler((e) => {
          console.error("❌ GAS call failed:", e);
        })
        .getHeadersForSheet(sheetName);
    }


      function toggleApiKeyVisibility(checkbox) {
        const field = document.getElementById("mapsApiKey");
        field.type = checkbox.checked ? "text" : "password";
      }

      function hideApiKeyOnBlur() {
        const field = document.getElementById("mapsApiKey");
        field.type = "password";
      }

      function cancelDialog() {
        google.script.host.close();
      }

      function saveSettings() {
        const sheet = document.getElementById("sheetSelect").value;
        const addressCol = document.getElementById("addressSelect").value;
        const apiKey = document.getElementById("mapsApiKey").value;
        const showLatLng = document.getElementById("showLatLng").checked;
        const debug = document.getElementById("debug").checked;

        if (!addressCol) {
          showHelp('addressColumn', event);
          return;
        }


google.script.run
  .withSuccessHandler(() => {
    console.log("✅ Preferences saved, closing dialog...");
    google.script.host.close();
  })
  .withFailureHandler(e => {
    console.error("❌ Failed to save preferences:", e);
    alert("Save failed: " + e.message);
  })
  .savePreferences({
    sheetName: sheet,
    addressColumn: addressCol,
    mapsApiKey: apiKey,
    showLatLong: showLatLng,
    debug: debug
  });

      }

function showHelp(topic, event) {
  console.log("🆘 Help icon clicked for topic:", topic, event);
  const messages = {
    mapsApiKey: `Enter your Google Maps API key. You can obtain this from the Google Cloud Console. Make sure the Maps JavaScript API is enabled.`,
    sheetTab: `Select the sheet where your data is stored.`,
    addressColumn: `Choose the column in your sheet that contains addresses.`,
    showLatLng: `Check this box to display the Latitude and Longitude results in your sheet.`,
    debug: `Enable this to log detailed debugging information for troubleshooting.`
  };
  alert(messages[topic] || "No help available for this section.");
}


    function keepThisBadShowHelp(topic, event) {
      console.log("🆘 Help icon clicked for topic:", topic, event);
      try {
        closeHelp(); // close any existing help
        const messages = {
          mapsApiKey: `Enter your Google Maps API key...`,
          sheetTab: `Select the sheet where your data is stored.`,
          addressColumn: `Choose the column in your sheet that contains addresses.`,
          showLatLng: `Check to display the Latitude and Longitude results in your sheet.`,
          debug: `Enable verbose logging for troubleshooting.`
        };

        const popup = document.createElement("div");
        popup.className = "help-popup";
        popup.innerHTML = messages[topic] || "No help available.";

        icon.parentElement.appendChild(popup);


        const icon = event.target;
        const rect = icon.getBoundingClientRect();
        console.log("📐 Icon bounds:", rect);

        popup.style.top = (window.scrollY + rect.bottom + 4) + "px";
        popup.style.left = (window.scrollX + rect.left - 20) + "px";

        document.addEventListener("click", closeHelp);
        document.addEventListener("keydown", escListener);
      } catch (e) {
        console.error("❌ showHelp error:", e);
      }
    }


      function closeHelp() {
        const existing = document.querySelector(".help-popup");
        if (existing) existing.remove();
        document.removeEventListener("click", closeHelp);
        document.removeEventListener("keydown", escListener);
      }

      function escListener(e) {
        if (e.key === "Escape") closeHelp();
      }
