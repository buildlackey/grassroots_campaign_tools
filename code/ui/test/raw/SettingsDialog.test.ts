// ===== FILE: SettingsDialog.test.ts =====
import { JSDOM } from "jsdom";
import { setupMock } from "./setupMock";

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

describe("SettingsDialog Save Button / Maps API key (config-driven)", () => {
  let dom: JSDOM;
  let document: Document;
  let window: any;

  // Parse DOM once; install an initial mock so inline scripts can run
  beforeAll(async () => {
    dom = new JSDOM(htmlContent, {
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
      beforeParse: (win) => {
        // No config yet; setupMock will use default fallback
        setupMock(win as any);
      },
    });

    window = dom.window;
    document = window.document;
    await waitForLoad(window);
  });

  beforeEach(() => {
    // Fail fast on console.error; quiet console.warn if desired
    jest
      .spyOn(window.console, "error")
      .mockImplementation((...args: any[]) => {
        throw new Error("console.error called: " + args.join(" "));
      });
    jest.spyOn(window.console, "warn").mockImplementation(() => {});

    // Each test sets window.__MOCK_CONFIG__ and then calls setupMock + onOpen()
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    dom?.window?.close();
  });

  //
  // test 1
  // Blocked: maps key present, but default Sheet1 has NO columns
  //
  test("Blocked when default Sheet1 has no columns (even with maps key)", async () => {
    // Config for this test
    (window as any).__MOCK_CONFIG__ = {
      mapsApiKey: "key1",
      sheets: {
        Sheet1: [],
        Sheet2: ["Name", "Address"],
        Sheet3: [],
      },
    };

    // Reinstall mock w/ this config and repopulate UI
    setupMock(window as any);
    // Use the same entrypoint the page uses at load time
    window.onOpen();
    await Promise.resolve();

    const sheetSelect = document.getElementById(
      "sheetSelect"
    ) as HTMLSelectElement;
    const addressSelect = document.getElementById(
      "addressSelect"
    ) as HTMLSelectElement;
    const saveBtn = document.querySelector(
      "button[onclick='saveSettings()']"
    ) as HTMLButtonElement;

    // Default is first sheet (Sheet1)
    expect(sheetSelect.value).toBe("Sheet1");
    // No columns → no address value
    expect(addressSelect.value).toBe("");

    // Expected: Save button blocked/disabled
    expect(saveBtn.disabled).toBeTruthy();
  });

  //
  // test 2
  // Enabled after switching to Sheet2 (has Address column)
  //
  test("Enabled after switching to Sheet2 which has Address column", async () => {
    // Same config as test 1
    (window as any).__MOCK_CONFIG__ = {
      mapsApiKey: "key1",
      sheets: {
        Sheet1: [],
        Sheet2: ["Name", "Address"],
        Sheet3: [],
      },
    };

    setupMock(window as any);
    window.onOpen();
    await Promise.resolve();

    const sheetSelect = document.getElementById(
      "sheetSelect"
    ) as HTMLSelectElement;
    const addressSelect = document.getElementById(
      "addressSelect"
    ) as HTMLSelectElement;
    const saveBtn = document.querySelector(
      "button[onclick='saveSettings()']"
    ) as HTMLButtonElement;

    // Switch to Sheet2
    sheetSelect.value = "Sheet2";
    sheetSelect.dispatchEvent(new window.Event("change"));
    await Promise.resolve();

    // Should auto-preselect an address-like header (case-insensitive)
    expect(addressSelect.value.toLowerCase()).toBe("address");

    // Expected: Save button enabled
    expect(saveBtn.disabled).toBeFalsy();
  });
});

