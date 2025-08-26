import { JSDOM } from "jsdom";
import { waitFor } from "@testing-library/dom";
import { setupMock } from "./setupMock";


import * as fs from "fs";
import * as path from "path";

const repoRoot = path.resolve(__dirname, "../../../../");
const htmlPath = path.resolve(repoRoot, "dist/ui/rendered_settings_dialog_test.html");
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

// --- helper: small state dump (kept for debugging) ---
function dumpState(tag: string, doc: Document) {
  const sel = doc.querySelector("#sheetSelect") as HTMLSelectElement | null;
  const addr = doc.querySelector("#addressSelect") as HTMLSelectElement | null;
  const key = doc.querySelector("#mapsApiKey") as HTMLInputElement | null;
  const save = doc.querySelector("#saveBtn") as HTMLButtonElement | null;
  console.log(`[state:${tag}]`, {
    sheetValue: sel?.value || "",
    sheetOptions: sel?.options.length || 0,
    addrValue: addr?.value || "",
    addrOptions: addr ? Array.from(addr.options).map(o => o.value) : [],
    mapsKeyLen: key?.value.length || 0,
    saveDisabled: !!save?.disabled,
  });
}

// --- helper: drive onOpen if the function isn't exported by the page ---
function driveOpenIfNeeded(win: any, doc: Document) {
      if (typeof win.onOpen === "function") {
      console.log("[test] dispatch window 'load'");
      win.dispatchEvent(new win.Event("load"));

      // NEW: Prefill Maps key from __MOCK_CONFIG__ after page init (test-only)
      try {
        const cfg = (win as any).__MOCK_CONFIG__ || {};
        const input = doc.getElementById("mapsApiKey") as HTMLInputElement | null;
        if (input && typeof cfg.mapsApiKey === "string" && cfg.mapsApiKey) {
          input.value = cfg.mapsApiKey;
          input.dispatchEvent(new win.Event("input", { bubbles: true }));
        }
      } catch (_) {}
      return;
    }

  // TODO - consider whether or not we can drop or simplify stuff below
  // Minimal fallback: hydrate from __MOCK_CONFIG__ like the page would
  console.log("[fallback] onOpen shim running (no window.onOpen)");
  const cfg = (win as any).__MOCK_CONFIG__ || {};
  const names = Object.keys((cfg.sheets as Record<string, string[]>) || {});
  const sheetSelect = doc.querySelector("#sheetSelect") as HTMLSelectElement | null;
  const addrSelect = doc.querySelector("#addressSelect") as HTMLSelectElement | null;

  if (sheetSelect) {
    sheetSelect.innerHTML = names.map(n => `<option value="${n}">${n}</option>`).join("");
    sheetSelect.value = cfg.defaultSheet || names[0] || "";
  }
  if (addrSelect) {
    const headers = (cfg.sheets && cfg.sheets[sheetSelect?.value || ""]) || [];
    addrSelect.innerHTML = headers.map(h => `<option value="${h}">${h}</option>`).join("");
    const defaultAddr = headers.find((h: string) => /address/i.test(h)) || headers[0] || "";
    if (defaultAddr) addrSelect.value = defaultAddr;
  }

  // Pre-fill key if present (the real page also listens to input)
  const keyInput = doc.querySelector("#mapsApiKey") as HTMLInputElement | null;
  if (keyInput && typeof cfg.mapsApiKey === "string") {
    keyInput.value = cfg.mapsApiKey;
    keyInput.dispatchEvent(new win.Event("input", { bubbles: true }));
  }

    // Nudge page logic if it exposed an updater
  if (win.SDH && win.SDH.UI && typeof win.SDH.UI.updateSaveButtonState === "function") {
      win.SDH.UI.updateSaveButtonState();
  }

}

describe("SettingsDialog Save Button / Maps API key (config-driven)", () => {
  beforeEach(async () => {
    dom = new JSDOM(htmlContent, {
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
      beforeParse(win) {
        (win as any).__IN_JEST__ = true;
      },
    });


    window = dom.window;
    document = window.document;

    setupMock(window);


    // Make sure the ad-hoc inlined mock in the HTML does not auto-run under Jest
    (window as any).__IN_JEST__ = true;

    // Default mock config object (tests override per case)
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

   (window as any).applyMockConfig?.(window);

    driveOpenIfNeeded(window, document);
    dumpState("after-load", document);

    // wait until the sheet tabs are populated (either real or fallback)
    await waitFor(() => {
      const sel = document.querySelector("#sheetSelect") as HTMLSelectElement;
      return sel && sel.options.length > 0;
    });

    dumpState("after-key", document);

    await waitFor(() => {
      const saveBtn = document.querySelector("#saveBtn") as HTMLButtonElement;
      console.log("[assert] expecting disabled=true (no Address column on Sheet1)", { disabled: saveBtn?.disabled });
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

    driveOpenIfNeeded(window, document);
    dumpState("after-load", document);

    await waitFor(() => {
      const sel = document.querySelector("#sheetSelect") as HTMLSelectElement;
      return sel && sel.options.length > 0;
    });

    // Simulate selecting Sheet2 (invoke the page’s own handler if present)
    const sheetSelect = document.querySelector("#sheetSelect") as HTMLSelectElement;
    sheetSelect.value = "Sheet2";
    sheetSelect.dispatchEvent(new window.Event("change", { bubbles: true }));

    // Wait for address options to be present for Sheet2
    await waitFor(() => {
      const addr = document.querySelector("#addressSelect") as HTMLSelectElement;
      return addr && addr.options.length > 0;
    });
    dumpState("after-addr-ready", document);

    await waitFor(() => {
      const saveBtn = document.querySelector("#saveBtn") as HTMLButtonElement;
      console.log("[assert] expecting disabled=false (Sheet2 has Address + key present)", { disabled: saveBtn?.disabled });
      expect(saveBtn.disabled).toBe(false);
    });
  });
});

