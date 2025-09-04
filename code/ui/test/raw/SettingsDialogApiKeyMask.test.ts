/**
 * @jest-environment jsdom
 */
import { JSDOM } from "jsdom";
import * as fs from "fs";
import * as path from "path";
import {bootDialog, installConsoleErrorFail} from "./testUtils";



const repoRoot = path.resolve(__dirname, "../../../../");
const htmlPath = path.resolve(repoRoot, "dist/ui/rendered_settings_dialog_test.html");
const htmlContent = fs.readFileSync(htmlPath, "utf-8");

let dom: JSDOM;
let document: Document;
let window: any;


beforeAll(() => {
    installConsoleErrorFail();
});


describe("SettingsDialog Maps API key field", () => {
    beforeEach(async () => {
        const boot = await bootDialog(htmlContent, {
            sheetTabNames: ["Sheet1"],
            sheetTabToColumnNames: { Sheet1: ["col1"] },
            prefs: { mapsApiKey: "key1" },
        });
        dom = boot.dom;
        window = boot.window;
        document = boot.document;
    });

    afterEach(() => {
        if (dom) dom.window.close();
    });

    test("masks on blur / shows on focus", () => {
        const input = document.getElementById("mapsApiKey") as HTMLInputElement;
        const saveBtn = document.getElementById("saveBtn") as HTMLButtonElement;

        input.type = "text";
        input.value = "Foo";

        // Focus → stays text
        input.dispatchEvent(new window.Event("focus", { bubbles: true }));
        expect(input.type).toBe("text");

        // Blur → masks
        saveBtn.focus();
        input.dispatchEvent(new window.Event("blur", { bubbles: true }));
        expect(input.type).toBe("password");

        // Focus again → unmasks
        input.dispatchEvent(new window.Event("focus", { bubbles: true }));
        expect(input.type).toBe("text");
    });
});
