/**
 * @jest-environment jsdom
 */
import { JSDOM } from "jsdom";
import { waitFor } from "@testing-library/dom";
import * as fs from "fs";
import * as path from "path";

import { setupGoogleMock, dumpState, waitForReady } from "./testUtils";

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

// 🔹 Helper updated to use CampaignToolsModel from window global
async function assertSaveButtonState(
    initData: {
        sheetTabNames: string[];
        sheetTabToColumnNames: Record<string, string[]>;
        prefs: { sheetTabName?: string; addressColumn?: string; mapsApiKey?: string };
    },
    expectedDisabled: boolean,
    expectedAddressValue: string
) {
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

    // 🔹 Grab CampaignToolsModel from the bundled global
    const CampaignToolsModel =
        (window as any).CAMPAIGN_TOOLS && (window as any).CAMPAIGN_TOOLS.CampaignToolsModel;
    if (!CampaignToolsModel) {
        throw new Error("CampaignToolsModel not found on window.CAMPAIGN_TOOLS");
    }

    // Construct model like production
    const model = new CampaignToolsModel({
        sheetTabNames: initData.sheetTabNames,
        sheetTabToColumnNames: initData.sheetTabToColumnNames,
        prefs: {
            sheetTabName: initData.prefs.sheetTabName || firstSheet,
            addressColumn: initData.prefs.addressColumn || "",
            mapsApiKey: initData.prefs.mapsApiKey || "",
            showLatLong: false,
            debug: false,
        },
    });

    // Trigger change with model
    window.SDH.UI.onSheetChange(model);

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
        dom = new JSDOM(htmlContent, {
            runScripts: "dangerously",
            resources: "usable",
            pretendToBeVisual: true,
            beforeParse(win) {
                win.document.addEventListener("sdh-ui-ready", () => {
                    (global as any).__SDH_READY_HANDLER__();
                });
            },
        });

        window = dom.window;
        document = window.document;

        setupGoogleMock(window); // uses default initData fixture

        window.dispatchEvent(new window.Event("load"));

        await waitForReady(dom);
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
            false,
            "foo"
        );
    });

    test("Save STILL enabled when prefs.addressColumn not match any header - as long as we have some headers", async () => {
        await assertSaveButtonState(
            {
                sheetTabNames: ["Sheet1", "Sheet2"],
                sheetTabToColumnNames: {
                    Sheet1: ["x", "y"],
                    Sheet2: ["bar", "baz"],
                },
                prefs: { mapsApiKey: "key1", addressColumn: "foo" },
            },
            false,
            "x"
        );
    });

    test("Save disabled when prefs.addressColumn not match any header - because there NO headers there", async () => {
        await assertSaveButtonState(
            {
                sheetTabNames: ["Sheet1", "Sheet2"],
                sheetTabToColumnNames: {
                    Sheet1: [],
                    Sheet2: ["bar", "baz"],
                },
                prefs: { mapsApiKey: "key1", addressColumn: "foo" },
            },
            true,
            ""
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

    test("mapsApiKey field should mask value after blur", async () => {
        const input = document.getElementById("mapsApiKey") as HTMLInputElement;
        input.type = "text";
        input.value = "Foo blah bar";

        input.dispatchEvent(new window.Event("blur", { bubbles: true }));

        expect(input.type).toBe("password");
    });

    test("mapsApiKey field masks on blur and unmasks on focus", async () => {
        const input = document.getElementById("mapsApiKey") as HTMLInputElement;
        const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
        input.type = "text";
        input.value = "Foo blah bar";

        input.dispatchEvent(new window.Event("focus", { bubbles: true }));
        expect(input.type).toBe("text");

        saveBtn.focus();
        input.dispatchEvent(new window.Event("blur", { bubbles: true }));
        expect(input.type).toBe("password");

        input.dispatchEvent(new window.Event("focus", { bubbles: true }));
        expect(input.type).toBe("text");
    });
});
