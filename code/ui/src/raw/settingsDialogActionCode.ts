console.log("[SettingsDialogActionCode] vA1 loading");

/**
 * DialogModel: normalized state we pass between functions (incremental adoption).
 * {
 *   sheetTabNames: string[],
 *   headersBySheet: Record<string, string[]>,
 *   prefs: { mapsApiKey?: string, addressColumn?: string, sheetTabName?: string, showLatLong?: boolean, debug?: boolean }
 * }
 */

// --- tiny logger ---
declare var SDH: any;
declare var google: any;

function log(...args: any[]) {
    try {
        args.unshift("[SettingsDialog]");
        console.log.apply(console, args);
    } catch (_) { }
}

// --- DOM helpers ---
function getSaveBtn(): HTMLButtonElement | null { return document.getElementById("saveBtn") as HTMLButtonElement | null; }
function hasMapsKey(): boolean {
    const el = document.getElementById("mapsApiKey") as HTMLInputElement | null;
    const v = el && typeof el.value === "string" ? el.value : "";
    return v.trim().length > 0;
}

function hasAddressSelection(): boolean {
    const el = document.getElementById("addressSelect") as HTMLSelectElement | null;
    const v = el && typeof el.value === "string" ? el.value : "";
    return v !== "";
}

// Bind + assert presence
function bindRequired(id: string, event: string, handler: EventListener): HTMLElement {
    var el = document.getElementById(id);
    if (!el) throw new Error(`Missing required element #${id}`);
    el.addEventListener(event, handler);
    log("bindRequired OK", { id, event });
    return el;
}

// ========= Event-driven readiness (simplified) =========
function waitForUIHelpers(): Promise<void> {
    // Resolves as soon as frosting dispatches sdh-ui-ready
    return new Promise((resolve: () => void) => {
        try {
            if ((window as any).SDH && (window as any).SDH.UI && (window as any).SDH.UI.ready === true) {
                resolve();
                return;
            }
            document.addEventListener("sdh-ui-ready", () => resolve(), { once: true });
        } catch (_) {
            resolve(); // fail-safe: don't block if something unexpected happens
        }
    });
}
// =======================================================

/** Create a small, explicit model we can pass around (already introduced in Stage 1) */
// ❌ no longer needed: createDialogModel()

window.addEventListener("load", onOpen);

function onOpen(): void {
    /** Consume model instead of raw data */
    function populateDialogFields(model: any): HTMLSelectElement | null {
        log("populateDialogFields → model =", model);
        const prefs = model.prefs || {};

        // Grab all required DOM elements up front
        const sheetSelect   = document.getElementById("sheetSelect") as HTMLSelectElement | null;
        const addressSelect = document.getElementById("addressSelect") as HTMLSelectElement | null;
        const mapsApiKey    = document.getElementById("mapsApiKey") as HTMLInputElement | null;
        const showLatLng    = document.getElementById("showLatLng") as HTMLInputElement | null;
        const debugChk      = document.getElementById("debug") as HTMLInputElement | null;

        // Populate sheet tab select list (functional map approach)
        if (sheetSelect) {
            sheetSelect.innerHTML = (model.sheetTabNames || [])
                .map((n: string) => `<option value="${n}">${n}</option>`)
                .join("");
            sheetSelect.value = model.preferredSheetTabName;
        }
        if (addressSelect) addressSelect.value = model.preferredAddressColumnName;
        if (mapsApiKey) mapsApiKey.value = prefs.mapsApiKey;
        if (showLatLng) showLatLng.checked = !!prefs.showLatLong;
        if (debugChk) debugChk.checked = !!prefs.debug;

        log("populateDialogFields → sheetSelect.value =", sheetSelect ? sheetSelect.value : null);
        log("populateDialogFields → addressSelect.value =", addressSelect ? addressSelect.value : null);

        return sheetSelect;
    }


    function wireUpEventHandlers(model: any) {
        bindRequired("sheetSelect", "change", function (this: HTMLElement, _evt: Event) {
            SDH.UI.onSheetChange(model);
        });

        bindRequired("saveBtn", "click", function (_evt: Event) {
            saveSettings(model);
        });

        bindRequired("showApiKey", "change", function (this: HTMLElement, _evt: Event) {
            SDH.UI.toggleApiKeyVisibility(this);
        });
        bindRequired("mapsApiKey", "blur", function (_evt: Event) { SDH.UI.hideApiKeyOnBlur(); });
        bindRequired("mapsApiKey", "focus", function (_evt: Event) { SDH.UI.showApiKeyOnFocus(); });
        bindRequired("mapsApiKey", "input", function (_evt: Event) { SDH.UI.updateSaveButtonState(); });

        bindRequired("addressSelect", "change", function (_evt: Event) { SDH.UI.updateSaveButtonState(); });
    }

    /** Pass the model into renderers */
    function renderSelectorForAddressColumn(model: any, preferredSheetSelect: HTMLSelectElement | null) {
        if (model.sheetTabNames.length > 0 && preferredSheetSelect) {
            SDH.UI.renderHeadersFor(preferredSheetSelect.value, model);
        }
        SDH.UI.updateSaveButtonState();

        SDH.UI.hideSpinner();
        log("onOpen processing DONE");
    }

    // Main entry point
    log("ENTER onOpen");
    SDH.UI.showSpinner();
    const chain =
        google.script.run
            .withSuccessHandler(function (responseFromRemote: any) {
                log("getInitData success", responseFromRemote);

                const sheetSelect = populateDialogFields(responseFromRemote);
                waitForUIHelpers().then(function () {
                    wireUpEventHandlers(responseFromRemote);
                    renderSelectorForAddressColumn(responseFromRemote, sheetSelect);
                });
            })
            .withFailureHandler(function (e: any) {
                console.error("❌ Failed to fetch init data:", e);
                SDH.UI.hideSpinner();
            });
    chain.getInitData();
}

// ===== dialog controls =====
function closeDialog() {
    log("closeDialog");
    try {
        if (google && google.script && google.script.host && typeof google.script.host.close === 'function') {
            google.script.host.close();
            return;
        }
    } catch (_) {}
    const c = document.getElementById('settings-dialog-container') || document.body;
    c.style.display = 'none';
}

// ===== actions =====
function saveSettings(model: any, _evt?: Event) {
    log("ENTER saveSettingsWith(model)");
    const btn = document.getElementById('saveBtn') as HTMLButtonElement | null;
    if (btn) btn.disabled = true;

    const sheetName = (document.getElementById("sheetSelect") as HTMLSelectElement | null)?.value || "";
    const address   = (document.getElementById("addressSelect") as HTMLSelectElement | null)?.value || "";
    const mapsKey   = (document.getElementById("mapsApiKey") as HTMLInputElement | null)?.value || "";
    const showLL    = !!((document.getElementById("showLatLng") as HTMLInputElement | null)?.checked);
    const debug     = !!((document.getElementById("debug") as HTMLInputElement | null)?.checked);

    const columns = (model.headersBySheet && model.headersBySheet[sheetName]) || [];

    const payload = {
        sheetTabName: sheetName,
        addressColumn: address,
        mapsApiKey: mapsKey,
        showLatLong: showLL,
        debug: debug
    };
    log("saveSettingsWith payload", payload, { columns });

    if (!mapsKey || !address) {
        if (btn) btn.disabled = true;
        console.error("❌ Missing required input(s):", { hasMapsKey: !!mapsKey, hasAddress: !!address });
        alert("❌ You must provide both a Maps API key and an Address column before saving.");
        return;
    }

    google.script.run
        .withSuccessHandler(function () {
            log("saveSettingsWith success → closing dialog");
            closeDialog();
        })
        .withFailureHandler(function (e: any) {
            console.error("❌ Failed to save preferences:", e);
            const btn = document.getElementById('saveBtn') as HTMLButtonElement | null;
            if (btn) btn.disabled = false;
            alert("Failed to save preferences.");
        })
        .savePreferences(payload, columns);
}

function cancelDialog() {
    log("cancelDialog");
    closeDialog();
}

// ===== keyboard: ESC closes dialog =====
(function () {
    function onKeydown(e: KeyboardEvent) {
        if (e && (e.key === 'Escape' || e.key === 'Esc')) {
            e.preventDefault();
            e.stopPropagation();
            log("keyboard escape → cancelDialog");
            cancelDialog();
        }
    }
    window.addEventListener('keydown', onKeydown, true);
})();
