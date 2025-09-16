/**
 * @jest-environment jsdom
 */
import { JSDOM } from "jsdom";
import { waitFor } from "@testing-library/dom";
import * as fs from "fs";
import * as path from "path";
import { bootDialog, dumpState, installConsoleErrorFail, buildDialogModelFixture } from "./testUtils";

const repoRoot = path.resolve(__dirname, "../../../../");
const htmlPath = path.resolve(repoRoot, "dist/ui/rendered_settings_dialog_test.html");
const htmlContent = fs.readFileSync(htmlPath, "utf-8");

let dom: JSDOM;
let document: Document;
let window: any;

beforeAll(() => {
    installConsoleErrorFail();
});

async function assertPreferredResolution(
    initData: any,
    expectedSheet: string,
    expectedAddress: string
) {
    const domWindowAndDoc = await bootDialog(htmlContent, initData);
    dom = domWindowAndDoc.dom;
    window = domWindowAndDoc.window;
    document = domWindowAndDoc.document;

    dumpState("after-init", document);

    const sheetSel = document.getElementById("sheetSelect") as HTMLSelectElement;
    const addrSel  = document.getElementById("addressSelect") as HTMLSelectElement;

    await waitFor(() => {
        expect(sheetSel.value).toBe(expectedSheet);
        expect(addrSel.value).toBe(expectedAddress);
    });

    dom.window.close();
}

describe("SettingsDialog preference resolution (sheet & address)", () => {
    test("[0] no preferences, sheet1 columns are ['name', 'address', 'rank'] → picks 'address'", async () => {
        const sheetTabToColumnNames = {
            Sheet1: ["name", "address", "rank"]
        };
        const initData = buildDialogModelFixture({
            sheetTabNames: ["Sheet1"],
            sheetTabToColumnNames,
            prefs: {},
        });
        await assertPreferredResolution(initData, "Sheet1", "address");
    });

    test("[1] pref sheet NOT present; pref address NOT present → fallbacks", async () => {
        const sheetTabToColumnNames = {
            a: ["1", "2", "9"],
            b: ["3", "4"],
            c: [],
        };
        const initData = buildDialogModelFixture({
            sheetTabNames: ["a", "b", "c"],
            sheetTabToColumnNames: sheetTabToColumnNames,
            prefs: { mapsApiKey: "key1", sheetTabName: "notThere", addressColumn: "notThere" },
        });
        await assertPreferredResolution(initData, "a", "1");
    });

    test("[2] pref sheet NOT present; pref address present in first tab → use it", async () => {
        const sheetTabToColumnNames = {
            a: ["1", "2", "9"],
            b: ["3", "4"],
            c: [],
        };
        const initData = buildDialogModelFixture({
            sheetTabNames: ["a", "b", "c"],
            sheetTabToColumnNames: sheetTabToColumnNames,
            prefs: { mapsApiKey: "key1", sheetTabName: "notThere", addressColumn: "2" },
        });
        await assertPreferredResolution(initData, "a", "2");
    });

    test("[3] pref sheet present; pref address NOT present there → first header of that sheet", async () => {
        const sheetTabToColumnNames = {
            a: ["1", "2", "9"],
            b: ["3", "4"],
            c: [],
        };
        const initData = buildDialogModelFixture({
            sheetTabNames: ["a", "b", "c"],
            sheetTabToColumnNames: sheetTabToColumnNames,
            prefs: { mapsApiKey: "key1", sheetTabName: "b", addressColumn: "notThere" },
        });
        await assertPreferredResolution(initData, "b", "3");
    });

    test("[4] pref sheet present; pref address present there → use it", async () => {
        const sheetTabToColumnNames = {
            a: ["1", "2", "9"],
            b: ["3", "4"],
            c: [],
        };
        const initData = buildDialogModelFixture({
            sheetTabNames: ["a", "b", "c"],
            sheetTabToColumnNames: sheetTabToColumnNames,
            prefs: { mapsApiKey: "key1", sheetTabName: "b", addressColumn: "4" },
        });
        await assertPreferredResolution(initData, "b", "4");
    });

    test("[5] pref sheet present but it has NO headers → address empty", async () => {
        const sheetTabToColumnNames = {
            a: ["1", "2", "9"],
            b: ["3", "4"],
            c: [],
        };
        const initData = buildDialogModelFixture({
            sheetTabNames: ["a", "b", "c"],
            sheetTabToColumnNames: sheetTabToColumnNames,
            prefs: { mapsApiKey: "key1", sheetTabName: "c", addressColumn: "anything" },
        });
        await assertPreferredResolution(initData, "c", "");
    });
});
