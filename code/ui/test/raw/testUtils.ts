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

export function dumpState(tag: string, doc: Document) {
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
 * Fail tests on console.error, but ignore harmless jsdom resource errors.
 * Call this once in a beforeAll() in each suite.
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
