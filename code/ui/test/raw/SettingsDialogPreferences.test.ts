/**
 * @jest-environment jsdom
 */
import { JSDOM } from "jsdom";
import { waitFor } from "@testing-library/dom";
import * as fs from "fs";
import * as path from "path";
import { bootDialog, dumpState, installConsoleErrorFail  } from "./testUtils";

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
    prefs: { sheetTabName?: string; addressColumn?: string },
    expectedSheet: string,
    expectedAddress: string
) {
    // Spreadsheet fixture per spec (tabs a/b/c, with c = no headers)
    const initData = {
        sheetTabNames: ["a", "b", "c"],
        sheetTabToColumnNames: {
            a: ["1", "2", "9"],
            b: ["3", "4"],
            c: [],
        },
        prefs: {
            mapsApiKey: "key1",
            sheetTabName: prefs.sheetTabName || "",
            addressColumn: prefs.addressColumn || "",
        },
    };

    // Boot the dialog with THIS fixture so onOpen + CampaignToolsModel choose values
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
    test("[1] pref sheet NOT present; pref address NOT present → fallbacks", async () => {
        // sheet: first tab "a"; address: first header of "a" → "1"
        await assertPreferredResolution(
            { sheetTabName: "notThere", addressColumn: "notThere" },
            "a",
            "1"
        );
    });

    test("[2] pref sheet NOT present; pref address present in first tab → use it", async () => {
        // sheet: "a"; address: "2" (exists in a)
        await assertPreferredResolution(
            { sheetTabName: "notThere", addressColumn: "2" },
            "a",
            "2"
        );
    });

    test("[3] pref sheet present; pref address NOT present there → first header of that sheet", async () => {
        // sheet: "b"; address: first header of b → "3"
        await assertPreferredResolution(
            { sheetTabName: "b", addressColumn: "notThere" },
            "b",
            "3"
        );
    });

    test("[4] pref sheet present; pref address present there → use it", async () => {
        // sheet: "b"; address: "4"
        await assertPreferredResolution(
            { sheetTabName: "b", addressColumn: "4" },
            "b",
            "4"
        );
    });

    test("[5] pref sheet present but it has NO headers → address empty", async () => {
        // sheet: "c" (empty headers) → addressSelect should be ""
        await assertPreferredResolution(
            { sheetTabName: "c", addressColumn: "anything" },
            "c",
            ""
        );
    });
});
