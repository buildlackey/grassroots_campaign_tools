/**
 * @jest-environment jsdom
 */
import { JSDOM } from "jsdom";
import { waitFor } from "@testing-library/dom";
import * as fs from "fs";
import * as path from "path";
import { bootDialog, dumpState } from "./testUtils";

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

/**
 * Each row defines:
 *  - description
 *  - initData (fixture fed to google.script.run.getInitData)
 *  - expectedDisabled
 *  - expectedAddress
 */
const cases: Array<[string, any, boolean, string]> = [
    [
        "Save enabled (mapsKey non-empty, falls back to first header)",
        {
            sheetTabNames: ["Sheet1", "Sheet2"],
            sheetTabToColumnNames: { Sheet1: ["someColumnHeader"], Sheet2: ["badbad"] },
            prefs: { mapsApiKey: "key1", addressColumn: "" },
        },
        false,
        "someColumnHeader",
    ],
    [
        "Save enabled when prefs.addressColumn matches a header",
        {
            sheetTabNames: ["Sheet1", "Sheet2"],
            sheetTabToColumnNames: { Sheet1: ["x", "foo", "y"], Sheet2: ["bar", "baz"] },
            prefs: { mapsApiKey: "key1", addressColumn: "foo" },
        },
        false,
        "foo",
    ],
    [
        "Save enabled with headers present even if pref address not found (pick first)",
        {
            sheetTabNames: ["Sheet1", "Sheet2"],
            sheetTabToColumnNames: { Sheet1: ["x", "y"], Sheet2: ["bar", "baz"] },
            prefs: { mapsApiKey: "key1", addressColumn: "zzz" },
        },
        false,
        "x",
    ],
    [
        "Save disabled when no headers in selected sheet",
        {
            sheetTabNames: ["Sheet1", "Sheet2"],
            sheetTabToColumnNames: { Sheet1: [], Sheet2: ["bar", "baz"] },
            prefs: { mapsApiKey: "key1", addressColumn: "foo" },
        },
        true,
        "",
    ],
    [
        "Save disabled when maps key empty (headers exist)",
        {
            sheetTabNames: ["Sheet1", "Sheet2"],
            sheetTabToColumnNames: { Sheet1: ["someColumnHeader"], Sheet2: ["badbad"] },
            prefs: { mapsApiKey: "", addressColumn: "" },
        },
        true,
        "someColumnHeader",
    ],
    [
        "Save disabled when maps key present but no headers anywhere",
        {
            sheetTabNames: ["Sheet1", "Sheet2"],
            sheetTabToColumnNames: { Sheet1: [], Sheet2: ["badbad"] },
            prefs: { mapsApiKey: "key1", addressColumn: "" },
        },
        true,
        "",
    ],
];

describe.each(cases)(
    "SettingsDialog Button State: %s",
    (_label, initData, expectedDisabled, expectedAddress) => {
        beforeEach(async () => {
            const boot = await bootDialog(htmlContent, initData);
            dom = boot.dom;
            window = boot.window;
            document = boot.document;
        });

        afterEach(() => {
            if (dom) dom.window.close();
        });

        test("renders selects and save state correctly", async () => {
            dumpState("after-init", document);

            await waitFor(() => {
                const saveBtn = document.querySelector("#saveBtn") as HTMLButtonElement;
                const addrSel = document.querySelector("#addressSelect") as HTMLSelectElement;
                expect(saveBtn.disabled).toBe(expectedDisabled);
                expect(addrSel.value).toBe(expectedAddress);
            });
        });
    }
);
