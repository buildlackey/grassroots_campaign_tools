import { JSDOM } from "jsdom";
import { waitFor } from "@testing-library/dom";
import { installMockGoogleScript } from "./mocks_gas";


import * as fs from "fs";
import * as path from "path";

const repoRoot = path.resolve(__dirname, "../../../../");
const htmlPath = path.resolve(repoRoot, "built/ui/rendered_settings_dialog_test.html");
const htmlContent = fs.readFileSync(htmlPath, "utf-8");

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let dom: JSDOM;
let document: Document;
let window: any;

beforeAll(() => {
  // Fail on console.error
  const origError = console.error;
  console.error = (...args: any[]) => {
    origError(...args);
    throw new Error(`Console error: ${args.join(" ")}`);
  };
});

describe("SettingsDialog Save Button / Maps API key (config-driven)", () => {
  beforeEach(async () => {
    dom = new JSDOM(htmlContent, {
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
    });

    window = dom.window;
    document = window.document;

    installMockGoogleScript(window);

    // Expose mock config to window before DOM ready
    (window as any).__MOCK_CONFIG__ = {};

    await delay(150);
  });

  test("Blocked when default Sheet1 has no columns (even with maps key)", async () => {
    (window as any).__MOCK_CONFIG__ = {
      mapsApiKey: "key1",
      sheets: {
        Sheet1: [],
        Sheet2: ["Address", "Phone"],
      },
      defaultSheet: "Sheet1",
    };

    // Trigger onOpen or equivalent setup
    (window as any).onOpen();

    await waitFor(() => {
      const saveBtn = document.querySelector("#saveBtn") as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(true);
    });
  });

  test("Enabled after switching to Sheet2 which has Address column", async () => {
    (window as any).__MOCK_CONFIG__ = {
      mapsApiKey: "key1",
      sheets: {
        Sheet1: [],
        Sheet2: ["Address", "Phone"],
      },
      defaultSheet: "Sheet1",
    };

    (window as any).onOpen();

    // Simulate selecting Sheet2
    const sheetSelect = document.querySelector("#sheetSelect") as HTMLSelectElement;
    sheetSelect.value = "Sheet2";
    sheetSelect.dispatchEvent(new window.Event("change", { bubbles: true })); // <-- minimal fix

    await waitFor(() => {
      const saveBtn = document.querySelector("#saveBtn") as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(false);
    });
  });
});
