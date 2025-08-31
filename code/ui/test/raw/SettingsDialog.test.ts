/**
 * @jest-environment jsdom
 */
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
        addrOptions: addr ? Array.from(addr.options).map((o) => o.value) : [],
        mapsKeyLen: key?.value.length || 0,
        saveDisabled: !!save?.disabled,
    });
}

// 🔹 Helper
async function assertSaveButtonState(
    initData: {
        sheetTabNames: string[];
        sheetTabToColumnNames: Record<string, string[]>;
        prefs: { addressColumn?: string; mapsApiKey?: string };
    },
    expectedDisabled: boolean,
    expectedAddressValue: string
) {
    // Seed state from payload
    window.SDH = window.SDH || { UI: { state: {} } };
    window.SDH.UI.state = {
        headersBySheet: initData.sheetTabToColumnNames,
        preferences: {
            addressColumn: initData.prefs.addressColumn || "",
        },
    };

    // Set sheetSelect to first sheet deterministically
    const firstSheet = initData.sheetTabNames[0] || "";
    const sheetSel = document.getElementById("sheetSelect") as HTMLSelectElement | null;
    if (sheetSel && firstSheet) {
        sheetSel.value = firstSheet;
    }

    // User types a Maps API key from prefs
    const keyInput = document.getElementById("mapsApiKey") as HTMLInputElement;
    keyInput.value = initData.prefs.mapsApiKey || "";
    keyInput.dispatchEvent(new window.Event("input", { bubbles: true }));

    // Trigger change
    window.SDH.UI.onSheetChange();

    dumpState("after-onSheetChange", document);

    // Assert
    await waitFor(() => {
        const saveBtn = document.querySelector("#saveBtn") as HTMLButtonElement;
        const addrSel = document.querySelector("#addressSelect") as HTMLSelectElement;
        expect(saveBtn.disabled).toBe(expectedDisabled);
        expect(addrSel.value).toBe(expectedAddressValue);
    });
}

describe("SettingsDialog Save Button / Maps API key (DOM-driven)", () => {
    beforeEach(async () => {
        // Prepare promise first
        const readyPromise = new Promise<void>((resolve, reject) => {
            const timer = setTimeout(
                () => reject(new Error("timeout waiting for sdh-ui-ready")),
                2000
            );
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

        window.dispatchEvent(new window.Event("load"));

        await readyPromise;
        await new Promise((r) => setTimeout(r, 100));
    });

    afterEach(() => {
        if (dom) {
            dom.window.close();
        }
    });

    test("Save enabled (mapsKey NON EMPTY, addressSelect falls back to first header)", async () => {
        await assertSaveButtonState(
            {
                sheetTabNames: ["Sheet1", "Sheet2"],
                sheetTabToColumnNames: {
                    Sheet1: ["someColumnHeader"],
                    Sheet2: ["badbad"],
                },
                prefs: { mapsApiKey: "key1", addressColumn: "" },
            },
            false,
            "someColumnHeader"
        );
    });

    test("Save enabled when prefs.addressColumn matches a header", async () => {
        await assertSaveButtonState(
            {
                sheetTabNames: ["Sheet1", "Sheet2"],
                sheetTabToColumnNames: {
                    Sheet1: ["x", "foo", "y"],
                    Sheet2: ["bar", "baz"],
                },
                prefs: { mapsApiKey: "key1", addressColumn: "foo" },
            },
            false, // expectedDisabled = Save should be enabled
            "foo"  // expectedAddressValue = selected column is foo
        );
    });

    test("Save disabled (mapsKey EMPTY, but headers exist)", async () => {
        await assertSaveButtonState(
            {
                sheetTabNames: ["Sheet1", "Sheet2"],
                sheetTabToColumnNames: {
                    Sheet1: ["someColumnHeader"],
                    Sheet2: ["badbad"],
                },
                prefs: { mapsApiKey: "", addressColumn: "" },
            },
            true,
            "someColumnHeader"
        );
    });

    test("Save disabled (mapsKey NON EMPTY, but no headers → addressSelect empty)", async () => {
        await assertSaveButtonState(
            {
                sheetTabNames: ["Sheet1", "Sheet2"],
                sheetTabToColumnNames: {
                    Sheet1: [],
                    Sheet2: ["badbad"],
                },
                prefs: { mapsApiKey: "key1", addressColumn: "" },
            },
            true,
            ""
        );
    });
});
