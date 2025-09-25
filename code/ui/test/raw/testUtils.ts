(globalThis as any).SpreadsheetApp = {
    getActiveSpreadsheet: () => ({
        getSheets: () => [
            {
                getName: () => "Sheet1",
                getLastColumn: () => 2,
                getLastRow: () => 1,
                getRange: (_row: number, _col: number, _numRows: number, _numCols: number) => ({
                    getValues: () => [["Address", "Name"]]
                })
            }
        ]
    })
};


// TypeScript ambient declaration for SpreadsheetApp (for test compile)
declare var SpreadsheetApp: any;


// Ensure GAS classes are loaded for tests
require("../../../gas/src/logic/SheetLayout");
require("../../../gas/src/logic/CampaignToolsModel");


// TypeScript global declaration for test logging flag
export {};
/**
 * Logging flag configuration for tests
 *
 * - LOGGING_ENABLED is set once at module load, based on environment variable or config file.
 * - globalThis.CAMPAIGN_TOOLS_ENABLE_LOGGING is set for Node.js/Jest tests (non-browser).
 * - (win as any).CAMPAIGN_TOOLS_ENABLE_LOGGING is set for JSDOM/browser-like tests in bootDialog.
 *
 * This ensures logging is consistently enabled/disabled for all test environments.
 *
 * Usage:
 *   - Set CAMPAIGN_TOOLS_ENABLE_LOGGING=true in your environment, or
 *   - Add { "CAMPAIGN_TOOLS_ENABLE_LOGGING": true } to testConfig.json
 *
 * Node/Jest tests use globalThis.
 * JSDOM/browser-like tests use window (set via beforeParse).
 */
declare global {
  interface GlobalThis {
    CAMPAIGN_TOOLS_ENABLE_LOGGING?: boolean;
  }
}

// code/ui/test/raw/testUtils.ts
import {JSDOM} from "jsdom";
import {CampaignToolsModel} from "../../../gas/src/logic/CampaignToolsModel";
import * as fs from "fs";
import * as path from "path";
import { getLoggingFlag } from '../../../common/test/testUtils';

export function setupGoogleMock(win: any, initData: any) {
    // Always return the fixture passed in via initData
    win.google = {
        script: {
            run: {
                withSuccessHandler(success: any) {
                    const chain = {
                        withFailureHandler: function (_failure: any) { return chain; },
                        getInitData: function () { success(initData); }, // <-- use the test's fixture
                        savePreferences: function () { success(); },
                    };
                    return chain;
                },
            },
        },
        host: { close: () => {} },
    };
}

export async function bootDialog(htmlContent: string, initData: any) {
    const dom = new JSDOM(htmlContent, {
        runScripts: "dangerously",
        resources: "usable",
        pretendToBeVisual: true,
        beforeParse(win) {
            // Use the cached logging flag for all JSDOM tests
            (win as any).CAMPAIGN_TOOLS_ENABLE_LOGGING = getLoggingFlag();

            // ✅ Prevent inline setupMock.js (at end of the HTML) from running in tests.
            // That inline mock only runs when !window.__IN_JEST__.
            (win as any).__IN_JEST__ = true;

            // Wire the 'ready' handshake before any page scripts run
            win.document.addEventListener("ui-frosting-ready", () => {
                if ((global as any).__SDH_READY_HANDLER__) {
                    (global as any).__SDH_READY_HANDLER__();
                }
            });
        },
    });

    const window = dom.window as any;
    const document = window.document as Document;

    // Install google mock for THIS test's fixture
    setupGoogleMock(window, initData);

    // Wait for frosting's ready event
    const readyPromise = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error("timeout waiting for ui-frosting-ready")),
            2000
        );
        (global as any).__SDH_READY_HANDLER__ = () => {
            clearTimeout(timer);
            resolve();
        };
    });

    // Fire 'load' so onOpen runs and calls getInitData → our mock answers
    window.dispatchEvent(new window.Event("load"));

    await readyPromise;
    await new Promise(r => setTimeout(r, 50)); // small settle for DOM updates

    return { dom, window, document };
}

function isDebugEnabled(doc: Document, prefs?: any): boolean {
    // Prefer explicit prefs argument
    if (prefs && typeof prefs.debug !== "undefined") return !!prefs.debug;
    // Try to get from window.CAMPAIGN_UI.model.prefs
    try {
        const win = (doc.defaultView || window) as any; // Cast to any to avoid TS2339
        return !!(win.CAMPAIGN_UI && win.CAMPAIGN_UI.model && win.CAMPAIGN_UI.model.prefs && win.CAMPAIGN_UI.model.prefs.debug);
    } catch (e) {}
    return false;
}

export function dumpState(tag: string, doc: Document, prefs?: any) {
    if (!isDebugEnabled(doc, prefs)) return;
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

/**
 * Fail tests on 'console.error', but ignore harmless jsdom resource errors.
 * Call this once in a beforeAll() in each suite.  This ensures that if any error other than
 * 'known noise' errors pop up, we will be able to investigate them.
 */
export function installConsoleErrorFail() {
    const origError = console.error;
    console.error = (...args: any[]) => {
        const arr = Array.isArray(args) ? args : [args];
        const msg = arr.map(String).join(" ");
        if (msg.includes("Could not load")) return; // ignore CSS fetch failures
        origError(...arr);
        throw new Error(`Console error: ${msg}`);
    };
}

/**
 * Builds a dialog model fixture using backend logic for preference resolution.
 * Uses CampaignToolsModel to ensure tests match backend logic.
 */
export function buildDialogModelFixture({
    sheetTabNames,
    sheetTabToColumnNames,
    prefs
}: {
    sheetTabNames: string[];
    sheetTabToColumnNames: Record<string, string[]>;
    prefs: {
        sheetTabName?: string;
        addressColumn?: string;
        mapsApiKey?: string;
        showLatLong?: boolean;
        debug?: boolean;
    };
}) {
    // Helper to create mock ISheet
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
    // Helper to create mock ISpreadsheet
    function makeMockSpreadsheet(sheetDefs: {name: string, headers: string[]}[]): any {
        return {
            getSheets: () => sheetDefs.map(def => makeMockSheet(def.name, def.headers))
        };
    }
    // Build mock spreadsheet from input
    const sheetDefs = Object.entries(sheetTabToColumnNames).map(([name, headers]) => ({ name, headers }));
    const mockSpreadsheet = makeMockSpreadsheet(sheetDefs);
    // Use fromGAS factory method
    const model = (globalThis as any).CAMPAIGN.CampaignToolsModel.fromGAS({
        sheetTabName: prefs.sheetTabName || "",
        addressColumn: prefs.addressColumn || "",
        mapsApiKey: prefs.mapsApiKey || "",
        showLatLong: !!prefs.showLatLong,
        debug: !!prefs.debug,
    }, mockSpreadsheet);
    return model.getModelState();
}
