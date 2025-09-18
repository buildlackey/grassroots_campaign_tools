// code/ui/test/raw/testUtils.ts
import { JSDOM } from "jsdom";

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
            // ✅ Prevent inline setupMock.js (at end of the HTML) from running in tests.
            // That inline mock only runs when !window.__IN_JEST__.
            (win as any).__IN_JEST__ = true;

            // Wire the 'ready' handshake before any page scripts run
            win.document.addEventListener("sdh-ui-ready", () => {
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
            () => reject(new Error("timeout waiting for sdh-ui-ready")),
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
    // Try to get from window.CAMPAIGN_TOOLS_UI.model.prefs
    try {
        const win = (doc.defaultView || window) as any; // Cast to any to avoid TS2339
        return !!(win.CAMPAIGN_TOOLS_UI && win.CAMPAIGN_TOOLS_UI.model && win.CAMPAIGN_TOOLS_UI.model.prefs && win.CAMPAIGN_TOOLS_UI.model.prefs.debug);
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
        const msg = args.join(" ");
        if (msg.includes("Could not load")) return; // ignore CSS fetch failures
        origError(...args);
        throw new Error(`Console error: ${msg}`);
    };
}

/**
 * Builds a dialog model fixture using backend logic for preference resolution.
 * Mirrors CampaignToolsModel.fromGAS and fallback logic.
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
    // Preferred sheet tab logic
    let preferredSheetTabName = prefs.sheetTabName && sheetTabNames.includes(prefs.sheetTabName)
        ? prefs.sheetTabName
        : (sheetTabNames[0] || "");

    // Preferred address column logic
    const headers = sheetTabToColumnNames[preferredSheetTabName] || [];
    const cleanHeaders = headers.filter(h => h != null && String(h).length > 0).map(String);
    let preferredAddressColumnName = "";
    if (prefs.addressColumn && cleanHeaders.includes(prefs.addressColumn)) {
        preferredAddressColumnName = prefs.addressColumn;
    } else {
        const match = cleanHeaders.find(h => /address/i.test(h));
        preferredAddressColumnName = match || cleanHeaders[0] || "";
    }

    return {
        sheetTabNames,
        sheetTabToColumnNames,
        prefs: {
            sheetTabName: prefs.sheetTabName || "",
            addressColumn: prefs.addressColumn || "",
            mapsApiKey: prefs.mapsApiKey || "",
            showLatLong: !!prefs.showLatLong,
            debug: !!prefs.debug,
        },
        preferredSheetTabName,
        preferredAddressColumnName,
    };
}
