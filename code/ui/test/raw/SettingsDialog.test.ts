import { JSDOM } from "jsdom";
import { waitFor } from "@testing-library/dom";
import * as fs from "fs";
import * as path from "path";

const repoRoot = path.resolve(__dirname, "../../../../");
const htmlPath = path.resolve(repoRoot, "dist/ui/rendered_settings_dialog_test.html");
const htmlContent = fs.readFileSync(htmlPath, "utf-8");

let dom: JSDOM;
let document: Document;
let window: any;

beforeAll(() => {
    // Fail on console.error, but ignore harmless jsdom resource errors
    const origError = console.error;
    console.error = (...args: any[]) => {
        const msg = args.join(" ");
        if (msg.includes("Could not load")) return; // ignore CSS fetch failures
        origError(...args);
        throw new Error(`Console error: ${msg}`);
    };
});

function setupGoogleMock(win: any) {
    win.google = {
        script: {
            run: {
                withSuccessHandler(success: any) {
                    const chain = {
                        withFailureHandler: function (_failure: any) {
                            // store failure but ignore for now
                            return chain;
                        },
                        getInitData: function () {
                            success({
                                sheetTabNames: ["Sheet1", "Sheet2"],
                                sheetTabToColumnNames: {
                                    Sheet1: [],
                                    Sheet2: ["Address", "Phone"],
                                },
                                prefs: {},
                            });
                        },
                        savePreferences: function () {
                            success();
                        },
                    };
                    return chain;
                },
            },
        },
        host: { close: () => {} },
    };
}


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

describe("SettingsDialog Save Button / Maps API key (DOM-driven)", () => {
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

        // Provide google.script.run stub
        setupGoogleMock(window);

        // Trigger onOpen just like a browser would
        window.dispatchEvent(new window.Event("load"));

        // wait for async init to run
        await new Promise(r => setTimeout(r, 100));
    });

    test("Save disabled when no Address column is selected", async () => {
        // User types a Maps API key
        const keyInput = document.getElementById("mapsApiKey") as HTMLInputElement;
        keyInput.value = "key1";
        keyInput.dispatchEvent(new window.Event("input", { bubbles: true }));

        // Select Sheet1 (no Address columns)
        const sheetSelect = document.getElementById("sheetSelect") as HTMLSelectElement;
        sheetSelect.value = "Sheet1";
        sheetSelect.dispatchEvent(new window.Event("change", { bubbles: true }));

        // Address dropdown has no valid entries
        const addrSelect = document.getElementById("addressSelect") as HTMLSelectElement;
        addrSelect.innerHTML = `<option value="Name">Name</option>`;
        addrSelect.value = "Name";
        addrSelect.dispatchEvent(new window.Event("change", { bubbles: true }));

        dumpState("after-Sheet1", document);

        await waitFor(() => {
            const saveBtn = document.querySelector("#saveBtn") as HTMLButtonElement;
            expect(saveBtn.disabled).toBe(true);
        });
    });

    test("Save enabled after switching to Sheet2 with Address column", async () => {
        // User types a Maps API key
        const keyInput = document.getElementById("mapsApiKey") as HTMLInputElement;
        keyInput.value = "key1";
        keyInput.dispatchEvent(new window.Event("input", { bubbles: true }));

        // Select Sheet2 (has Address)
        const sheetSelect = document.getElementById("sheetSelect") as HTMLSelectElement;
        sheetSelect.value = "Sheet2";
        sheetSelect.dispatchEvent(new window.Event("change", { bubbles: true }));

        // Populate Address column
        const addrSelect = document.getElementById("addressSelect") as HTMLSelectElement;
        addrSelect.innerHTML = `
      <option value="Name">Name</option>
      <option value="Address">Address</option>
    `;
        addrSelect.value = "Address";
        addrSelect.dispatchEvent(new window.Event("change", { bubbles: true }));

        dumpState("after-Sheet2", document);

        await waitFor(() => {
            const saveBtn = document.querySelector("#saveBtn") as HTMLButtonElement;
            expect(saveBtn.disabled).toBe(false);
        });
    });
});
