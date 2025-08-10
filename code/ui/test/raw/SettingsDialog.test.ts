import { JSDOM } from "jsdom";
import { installMockGoogleScript } from "./installMockGoogleScript";

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

  // 1) Create and parse JSDOM ONCE
  beforeAll(async () => {
    dom = new JSDOM(htmlContent, {
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
      // We still need the mock present for the initial load (onOpen)
      beforeParse: (win) => {
        installMockGoogleScript(win as any);
      },
    });

    window = dom.window;
    document = window.document;

    // Wait until inline scripts run and load fires (onOpen runs once here)
    await waitForLoad(window);
  });

  // 2) Reinstall/refresh the mock BEFORE EACH TEST (no config yet)
  beforeEach(() => {
    // Reinstall the mock on the existing window to reset handler chains
    installMockGoogleScript(window as any);

    // Fresh console spies per test; fail fast on console.error
    jest
      .spyOn(window.console, "error")
      .mockImplementation((...args: any[]) => {
        throw new Error("console.error called: " + args.join(" "));
      });

    // Optional: ignore warnings like “no address column found”
    jest.spyOn(window.console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    // Close the JSDOM window to release resources
    dom?.window?.close();
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

    expect(addressSelect.value).toBe("address1");

    const saveBtn = document.querySelector(
      "button[onclick='saveSettings()']"
    ) as HTMLButtonElement;

    console.log("Save button HTML:", saveBtn.outerHTML);
    console.log("disabled:", saveBtn.disabled, "text:", saveBtn.textContent);

    expect(saveBtn.disabled).toBeFalsy();
  });
});

