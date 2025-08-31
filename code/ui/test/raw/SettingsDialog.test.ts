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

// 🔹 Helper
async function assertSaveButtonState(
    headersBySheet: Record<string, string[]>,
    mapsKey: string,
    expectedDisabled: boolean
) {
    // Seed state
    window.SDH = window.SDH || { UI: { state: {} } };
    window.SDH.UI.state.headersBySheet = headersBySheet;

    // User types a Maps API key
    const keyInput = document.getElementById("mapsApiKey") as HTMLInputElement;
    keyInput.value = mapsKey;
    keyInput.dispatchEvent(new window.Event("input", { bubbles: true }));

    // Trigger change
    window.SDH.UI.onSheetChange();

    dumpState("after-onSheetChange", document);

    // Assert
    await waitFor(() => {
        const saveBtn = document.querySelector("#saveBtn") as HTMLButtonElement;
        expect(saveBtn.disabled).toBe(expectedDisabled);
    });
}

describe("SettingsDialog Save Button / Maps API key (DOM-driven)", () => {
    beforeEach(async () => {
        // 🔹 Prepare promise first
        let readyResolve: () => void;
        const readyPromise = new Promise<void>((resolve, reject) => {
            readyResolve = resolve;
            const timer = setTimeout(() => reject(new Error("timeout waiting for sdh-ui-ready")), 2000);
            // Listener will be bound after DOM created
            (global as any).__SDH_READY_HANDLER__ = () => {
                clearTimeout(timer);
                resolve();
            };
        });

        dom = new JSDOM(htmlContent, {
            runScripts: "dangerously",
            resources: "usable",
            pretendToBeVisual: true,
            beforeParse(win) {
                (win as any).__IN_JEST__ = true;
                // 🔹 Attach listener hook here
                win.document.addEventListener("sdh-ui-ready", () => {
                    if ((global as any).__SDH_READY_HANDLER__) {
                        (global as any).__SDH_READY_HANDLER__();
                    }
                });
            },
        });

        window = dom.window;
        document = window.document;

        setupGoogleMock(window);

        // Trigger onOpen just like a browser would
        window.dispatchEvent(new window.Event("load"));

        // wait for async init to run
        await readyPromise;
        await new Promise(r => setTimeout(r, 100));
    });


    afterEach(() => {
        if (dom) {
            dom.window.close();   // shuts down timers, resources
        }
    });

    test("Save enabled after switching to a sheet with some Address column header", async () => {
        await assertSaveButtonState(
            { Sheet1: ["someColumnHeader"], Sheet2: ["badbad"] },
            "key1",
            false
        );
    });

    test("Save disabled after switching to a sheet with no Address column", async () => {
        await assertSaveButtonState(
            { Sheet1: [], Sheet2: ["badbad"] },
            "key1",
            true
        );
    });
});
