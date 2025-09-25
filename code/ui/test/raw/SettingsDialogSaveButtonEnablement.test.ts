/**
 * @jest-environment jsdom
 */
import { JSDOM } from "jsdom";
import { waitFor } from "@testing-library/dom";
import * as fs from "fs";
import * as path from "path";
import { bootDialog, dumpState, installConsoleErrorFail } from "./testUtils";
import { CampaignToolsModel } from "../../../gas/src/logic/CampaignToolsModel";

const repoRoot = path.resolve(__dirname, "../../../../");
const htmlPath = path.resolve(repoRoot, "dist/ui/rendered_settings_dialog_test.html");
const htmlContent = fs.readFileSync(htmlPath, "utf-8");

let dom: JSDOM;
let document: Document;
let window: any;

beforeAll(() => {
    installConsoleErrorFail();
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

// Update test logic to use model's computed values

function makeMockSheet(name: string, headers: string[]): any {
    return {
        getName: () => name,
        getLastColumn: () => headers.length,
        getLastRow: () => headers.length > 0 ? 1 : 0,
        getRange: (_row: number, _col: number, _numRows: number, _numCols: number) => ({
            getValues: () => [headers]
        })
    };
}

function makeMockSpreadsheet(sheetDefs: {name: string, headers: string[]}[]): any {
    return {
        getSheets: () => sheetDefs.map(def => makeMockSheet(def.name, def.headers))
    };
}

require("../../../gas/src/logic/CampaignToolsModel");

describe("SettingsDialog Save button enablement", () => {
    test.each(cases)("%s", async (_desc, fixture, expectedDisabled, expectedAddress) => {
        // Build mock spreadsheet from fixture
        const sheetDefs = Object.entries(fixture.sheetTabToColumnNames)
            .map(([name, headers]) => ({ name, headers: headers as string[] }));
        const mockSpreadsheet = makeMockSpreadsheet(sheetDefs);
        const model = (globalThis as any).CAMPAIGN.CampaignToolsModel.fromGAS(fixture.prefs, mockSpreadsheet);
        const initData = model.getModelState();
        const domWindowAndDoc = await bootDialog(htmlContent, initData);

        dom = domWindowAndDoc.dom;
        window = domWindowAndDoc.window;
        document = domWindowAndDoc.document;

        dumpState("after-init", document);

        const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;
        const addrSel = document.getElementById("addressSelect") as HTMLSelectElement;

        await waitFor(() => {
            expect(saveBtn.disabled).toBe(expectedDisabled);
            expect(addrSel.value).toBe(expectedAddress);
        });

        dom.window.close();
    });
});
