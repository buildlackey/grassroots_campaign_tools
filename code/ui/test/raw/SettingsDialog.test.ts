import { JSDOM } from "jsdom";
import { installMockGoogleScript } from "./support/installMockGoogleScript";

import * as fs from "fs";
import * as path from "path";



const repoRoot = path.resolve(__dirname, "../../../../"); // up to repo root
const htmlPath = path.resolve(repoRoot, "built/ui/rendered_settings_dialog_test.html");
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
      pretendToBeVisual: true,
    });

    window = dom.window;
    document = window.document;

    installMockGoogleScript(window);

    await delay(150); // allow script execution
  });

  test("Save button becomes enabled after selecting Sheet2 with valid address column", async () => {
    const sheetSelect = document.getElementById("sheetSelect") as HTMLSelectElement;
    sheetSelect.value = "Sheet2";
    sheetSelect.dispatchEvent(new window.Event("change"));

    await delay(100);

    const addressSelect = document.getElementById("addressSelect") as HTMLSelectElement;
    addressSelect.value = "Address";
    addressSelect.dispatchEvent(new window.Event("change"));

    const saveBtn = document.querySelector("button[onclick='saveSettings()']") as HTMLButtonElement;

// Dump full outer HTML so you see tag + attributes
console.log("Save button HTML:", saveBtn.outerHTML);

// Or dump key props
console.log("disabled:", saveBtn.disabled, "text:", saveBtn.textContent);


    expect(saveBtn.disabled).toBeFalsy();
  });
});

