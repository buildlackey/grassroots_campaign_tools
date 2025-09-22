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
import { JSDOM } from "jsdom";
import { CampaignToolsModel } from "../../../gas/src/logic/CampaignToolsModel";
import * as fs from "fs";
import * as path from "path";

function getLoggingFlag(): boolean {

    // Dump all environment variables for debugging
    if (typeof process !== "undefined" && process.env) {
        console.log("process.env dump:", JSON.stringify(process.env, null, 2));
    }



    let home = process.env.HOME;

    console.log("home:" + home);

    try {
        const homeDir = home || process.env.USERPROFILE;

        console.log("homeDir:" + homeDir);

        if (homeDir) {
            const configPath = path.resolve(homeDir, ".campaign", "test-config.json");

            console.log("configPath:" + configPath);

            if (fs.existsSync(configPath)) {
                const raw = fs.readFileSync(configPath, "utf8");
                console.log("raw:" + raw);
                if (raw.trim()) {
                    const config = JSON.parse(raw);
                    if (typeof config.CAMPAIGN_TOOLS_ENABLE_LOGGING !== "undefined") {
                        console.log("CHECK: $HOME/.campaign/test-config.json case");
                        return !!config.CAMPAIGN_TOOLS_ENABLE_LOGGING;
                    }
                }
            }
        }
    } catch (e) {
        console.log("CHECK: error reading $HOME/.campaign/test-config.json", e);
    }

    console.log("CHECK: default");
    return false;
}

// Enable logging for all Jest tests (configurable)
const LOGGING_ENABLED = getLoggingFlag();
globalThis.CAMPAIGN_TOOLS_ENABLE_LOGGING = LOGGING_ENABLED;

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
            (win as any).CAMPAIGN_TOOLS_ENABLE_LOGGING = LOGGING_ENABLED;

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
    const model = new CampaignToolsModel({
        sheetTabNames,
        sheetTabToColumnNames,
        prefs: {
            sheetTabName: prefs.sheetTabName || "",
            addressColumn: prefs.addressColumn || "",
            mapsApiKey: prefs.mapsApiKey || "",
            showLatLong: !!prefs.showLatLong,
            debug: !!prefs.debug,
        }
    });
    return model.getModelState();
}

