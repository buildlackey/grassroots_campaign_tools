import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";

const htmlPath = "/tmp/rendered_settings_dialog_test.html";
const htmlContent = fs.readFileSync(htmlPath, "utf-8");

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe("SettingsDialog Save Button Enablement", () => {
  let dom: JSDOM;
  let document: Document;
  let window: any;

  beforeEach(async () => {
    dom = new JSDOM(htmlContent, {
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true
    });

    window = dom.window;
    document = window.document;

    // Inject mock config before scripts run
    window.__MOCK_CONFIG__ = {
      mapsApiKey: "key1",
      sheets: {
        Sheet1: [],
        Sheet2: ["Address", "City"],
        Sheet3: []
      }
    };

    // Patch global so mocks_gas.js can hook into window
    global.window = window;
    require("../../test/support/mocks_gas.js");

    // Wait for scripts to execute and DOM to initialize
    await delay(150);
  });

  test("Save button is disabled when default Sheet1 has no address columns", async () => {
    const saveBtn = document.querySelector("button[onclick='saveSettings()']") as HTMLButtonElement;
    expect(saveBtn.disabled).toBeTruthy();
  });

  test("Save button becomes enabled after selecting Sheet2 with valid address column", async () => {
    const sheetSelect = document.getElementById("sheetSelect") as HTMLSelectElement;
    sheetSelect.value = "Sheet2";
    sheetSelect.dispatchEvent(new window.Event("change"));

    await delay(100); // Wait for addressSelect to populate

    const addressSelect = document.getElementById("addressSelect") as HTMLSelectElement;
    addressSelect.value = "Address";
    addressSelect.dispatchEvent(new window.Event("change"));

    const saveBtn = document.querySelector("button[onclick='saveSettings()']") as HTMLButtonElement;
    expect(saveBtn.disabled).toBeFalsy();
  });
});

