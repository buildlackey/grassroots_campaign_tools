import { JSDOM } from "jsdom";
import { waitFor } from "@testing-library/dom";

export function setupGoogleMock(win: any, initData?: any) {
    const defaultInitData = {
        sheetTabNames: ["Sheet1", "Sheet2"],
        sheetTabToColumnNames: {
            Sheet1: [],
            Sheet2: ["Address", "Phone"],
        },
        prefs: {},
    };
    const data = initData || defaultInitData;

    win.google = {
        script: {
            run: {
                withSuccessHandler(success: any) {
                    const chain = {
                        withFailureHandler: function (_failure: any) {
                            return chain;
                        },
                        getInitData: function () {
                            success(data);
                        },
                        savePreferences: function () {
                            success();
                        },
                    };
                    return chain;
                },
            },
        },
        host: { close: () => {} },
    };
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
        addrOptions: addr ? Array.from(addr.options).map((o) => o.value) : [],
        mapsKeyLen: key?.value.length || 0,
        saveDisabled: !!save?.disabled,
    });
}

export async function waitForReady(dom: JSDOM) {
    return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error("timeout waiting for sdh-ui-ready")),
            2000
        );
        (global as any).__SDH_READY_HANDLER__ = () => {
            clearTimeout(timer);
            resolve();
        };
    });
}
