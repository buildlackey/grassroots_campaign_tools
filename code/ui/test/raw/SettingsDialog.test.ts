import { JSDOM } from "jsdom";
import { installMockGoogleScript } from "./support/installMockGoogleScript";

import * as fs from "fs";
import * as path from "path";

const repoRoot = path.resolve(__dirname, "../../../../"); // up to repo root
const htmlPath = path.resolve(
  repoRoot,
  "built/ui/rendered_settings_dialog_test.html"
);
const htmlContent = fs.readFileSync(htmlPath, "utf-8");

function waitForLoad(win: Window): Promise<void> {
  return new Promise((resolve) => {
    const doc = (win as any).document;
    if (doc?.readyState === "complete") resolve();
    else win.addEventListener("load", () => resolve());
  });
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
      // ✅ install mock BEFORE any inline <script> runs
      beforeParse: (win) => {
        installMockGoogleScript(win as any);
      },
    });

    window = dom.window;
    document = window.document;

    // 🚨 Fail fast if any console.error happens during load or later
    jest
      .spyOn(window.console, "error")
      .mockImplementation((...args: any[]) => {
        throw new Error("console.error called: " + args.join(" "));
      });

    // (Optional) suppress warns if you don’t care about “no address column found”
    jest.spyOn(window.console, "warn").mockImplementation(() => {});

    // Wait until all scripts have run and load event fired
    await waitForLoad(window);
  });

  test("Save button becomes enabled after selecting Sheet2 with valid address column", async () => {
    const sheetSelect = document.getElementById(
      "sheetSelect"
    ) as HTMLSelectElement;
    sheetSelect.value = "Sheet2";
    sheetSelect.dispatchEvent(new window.Event("change"));

    // Let the change handler run
    await Promise.resolve();

    const addressSelect = document.getElementById(
      "addressSelect"
    ) as HTMLSelectElement;
    addressSelect.value = "Address";
    addressSelect.dispatchEvent(new window.Event("change"));

    const saveBtn = document.querySelector(
      "button[onclick='saveSettings()']"
    ) as HTMLButtonElement;

    // Dump full outer HTML so you see tag + attributes
    console.log("Save button HTML:", saveBtn.outerHTML);

    // Or dump key props
    console.log("disabled:", saveBtn.disabled, "text:", saveBtn.textContent);

    expect(saveBtn.disabled).toBeFalsy();
  });
});

