declare const google: any; // GAS runtime

// ✅ Global augmentation syntax allowed in global script
interface Window {
  FormValidation?: {
    MESSAGE?: string;
  };
}

let sheets: string[] = [];
let headers: string[] = [];

window.addEventListener("load", onOpen);

function onOpen(): void {
  alert("🔍 Fetching sheet tabs...");
  google.script.run.withSuccessHandler((sheetNames: string[]) => {
      alert("🔍 script running ...");
      if (window.FormValidation && window.FormValidation.MESSAGE) {
            alert("✅ FormValidation loaded: " + window.FormValidation.MESSAGE);
      } else {
            alert("❌ FormValidation 888 not loaded");
      }
      alert(sheets);
      alert(headers);
      alert(sheetNames);
      saveSettings();
  }).getSheetTabNames();
}

function saveSettings(): void {
}

