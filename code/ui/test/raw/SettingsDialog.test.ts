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

        await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("timeout waiting for sdh-ui-ready")), 2000);
            document.addEventListener("sdh-ui-ready", () => {
                clearTimeout(timer);
                resolve();
            });
        });


        // Trigger onOpen just like a browser would
        window.dispatchEvent(new window.Event("load"));

        // wait for async init to run
        await new Promise(r => setTimeout(r, 100));
    });


    afterEach(() => {
        if (dom) {
            dom.window.close();   // shuts down timers, resources
        }
    });


    test("Save enabled after switching to a sheet with some Address column header", async () => {
        // Seed state so renderHeadersFor has something to work with
        window.SDH = window.SDH || { UI: { state: {} } };
        window.SDH.UI.state.headersBySheet = {
            Sheet1: ["someColumnHeader"],
            Sheet2: ["badbad"],
        };

        console.log("[TEST] ", name);

        // User types a Maps API key
        const keyInput = document.getElementById("mapsApiKey") as HTMLInputElement;
        keyInput.value = "key1";
        keyInput.dispatchEvent(new window.Event("input", { bubbles: true }));



        window.SDH.UI.onSheetChange();

        dumpState("after-Sheet2", document);

        // Wait for Save button to become enabled
        await waitFor(() => {
            const saveBtn = document.querySelector("#saveBtn") as HTMLButtonElement;
            expect(saveBtn.disabled).toBe(false);
        });
    });

    test("Save disabled after switching to a sheet with no Address column", async () => {
        // Seed state so renderHeadersFor has something to work with
        window.SDH = window.SDH || { UI: { state: {} } };
        window.SDH.UI.state.headersBySheet = {
            Sheet1: [],
            Sheet2: ["badbad"],
        };

        console.log("[TEST] ", name);

        // User types a Maps API key
        const keyInput = document.getElementById("mapsApiKey") as HTMLInputElement;
        keyInput.value = "key1";
        keyInput.dispatchEvent(new window.Event("input", { bubbles: true }));



        window.SDH.UI.onSheetChange();

        dumpState("after-Sheet2", document);

        // Wait for Save button to become enabled
        await waitFor(() => {
            const saveBtn = document.querySelector("#saveBtn") as HTMLButtonElement;
            expect(saveBtn.disabled).toBe(true);
        });
    });

});
