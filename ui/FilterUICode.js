
  let DEBUG_MODE = false;
  let autocomplete;

  function logToDom(msg) {
    if (!DEBUG_MODE) return;

    console.log(msg); // always send to browser console

    const dbg = document.getElementById("debug");
    if (dbg) {
      dbg.style.display = "block";
      dbg.textContent += msg + "\n";
    }
  }

  function updateSlider(val) {
    document.getElementById("distanceVal").innerText = val;
  }

  function initAutocomplete() {
    logToDom("🚀 initAutocomplete() entered");
    const input = document.getElementById("address");
    autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['geocode'],
      componentRestrictions: { country: "us" }
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const json = JSON.stringify(place, null, 2);
      const preview = json.length > 200 ? json.slice(0, 200) + "..." : json;
      logToDom("📍 Place selected (preview):\n" + preview);
    });
  }

  function showAlert(message) {
    document.getElementById("customAlertMessage").textContent = message;
    document.getElementById("customAlert").style.display = "block";
  }

  function hideAlert() {
    document.getElementById("customAlert").style.display = "none";
  }

  function showToast(message, duration = 4000) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.visibility = "visible";
    toast.style.opacity = "1";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.visibility = "hidden";
    }, duration);
  }

function submitForm() {
  const addressInput = document.getElementById("address");
  const distInput = document.getElementById("distance");

  if (!addressInput || !distInput) {
    logToDom("❌ Input elements not found in DOM.");
    return;
  }

  const address = addressInput.value.trim();
  const distanceMiles = parseFloat(distInput.value);

  if (!address) {
    showAlert("❌ Please enter an address.");
    return;
  }

  const place = autocomplete?.getPlace?.();
  logToDom("📍 autocomplete.getPlace():\n" + JSON.stringify(place, null, 2));

  if (!place?.geometry?.location) {
    showAlert("❌ Please select an address from the suggestions.");
    return;
  }

  const userLat = place.geometry.location.lat();
  const userLng = place.geometry.location.lng();


  google.script.run
      .withSuccessHandler(result => {
        if (result.cancelled) {
          showToast("⚠️ Operation cancelled. The existing 'Filtered Results' sheet was left unchanged.");
          logToDom("🚫 User cancelled overwrite.");
          // do NOT close dialog
        } else if (!result.matched) {
          showAlert("❌ No matching candidates found within selected radius.");
          logToDom("❌ No candidates qualified.");
          // do NOT close dialog
        } else {
          showToast(`✅ ${result.count} candidates saved to sheet: ${result.sheetName}`);
          logToDom(`✅ Matches written to sheet: ${result.sheetName}`);
          setTimeout(() => google.script.host.close(), 2000);  // wait and then only close after successful match
        }
      })
      .withFailureHandler(err => {
        logToDom("❌ Failed to run match filter.");
        console.error(err);
        showAlert("❌ Error running match filter.");
        // do NOT close dialog
      })
      .filterAndWriteMatches(userLat, userLng, distanceMiles);
}



  const debugPromise = new Promise(resolve => {
    google.script.run
      .withSuccessHandler(enabled => {
        DEBUG_MODE = enabled;
        logToDom("🪵 Debug mode enabled: " + DEBUG_MODE);
        resolve();
      })
      .withFailureHandler(err => {
        console.warn("⚠️ Failed to retrieve DEBUG flag:", err.message);
        resolve();
      })
      .getDebug();
  });

  const apiKeyPromise = new Promise(resolve => {
    google.script.run
      .withSuccessHandler(key => resolve(key))
      .withFailureHandler(err => {
        logToDom("❌ Failed to get Maps API key: " + JSON.stringify(err.message));
        resolve(null);
      })
      .getMapsApiKey();
  });

  apiKeyPromise.then(key => {
    logToDom("✅ Got API key from server");

    if (typeof key === 'string') {
      const url = "https://maps.googleapis.com/maps/api/js?key=" + key + "&libraries=places&callback=initAutocomplete";

      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.defer = true;
      script.onload = () => logToDom("✅ Maps API script loaded");
      script.onerror = () => {
        logToDom("❌ Failed to load Maps API script");
        showAlert("❌ Maps API load failure");
      };

      document.head.appendChild(script);
    } else {
      logToDom("⚠️ Skipping Maps API script load due to missing key");
    }
  });
