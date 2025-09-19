// Fallback logger for test environments
if (typeof window !== "undefined") {
    window.CAMPAIGN_TOOLS = window.CAMPAIGN_TOOLS || {};
    if (!window.CAMPAIGN_TOOLS.CampaignToolsLogger) {
        class FallbackLogger {
            isEnabled: boolean;
            constructor(debug: boolean) { this.isEnabled = !!debug; }
            log(msg: string, ...args: any[]) { if (this.isEnabled) console.log(msg, ...args); }
        }
        window.CAMPAIGN_TOOLS.CampaignToolsLogger = FallbackLogger;
    }
}

declare var CAMPAIGN_TOOLS: any;
declare var google: any;

/** TypeScript type declaration for CampaignToolsLogger */
declare class CampaignToolsLogger {
    constructor(debug: boolean);
    log(message: string, ...args: any[]): void;
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
    CAMPAIGN_TOOLS.logger.log("bindRequired OK", { id, event });
    return el;
}

// --- Namespace setup ---
(window as any).CAMPAIGN_TOOLS = (window as any).CAMPAIGN_TOOLS || {};
(window as any).CAMPAIGN_TOOLS.UI = (window as any).CAMPAIGN_TOOLS.UI || {};
(window as any).CAMPAIGN_TOOLS_UI = (window as any).CAMPAIGN_TOOLS.UI;

function waitForUIHelpers(): Promise<void> {
    // Resolves as soon as frosting dispatches ui-frosting-ready
    return new Promise((resolve: () => void) => {
        try {
            if ((window as any).CAMPAIGN_TOOLS && (window as any).CAMPAIGN_TOOLS.UI && (window as any).CAMPAIGN_TOOLS.UI.ready === true) {
                resolve();
                return;
            }
            document.addEventListener("ui-frosting-ready", () => resolve(), { once: true });
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
        CAMPAIGN_TOOLS.logger = new (window as any).CAMPAIGN_TOOLS.CampaignToolsLogger(model.prefs && model.prefs.debug);
        CAMPAIGN_TOOLS.logger.log("populateDialogFields → model =", model);
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
        // Populate address column select list
        if (addressSelect && sheetSelect) {
            const columns = (model.sheetTabToColumnNames && model.sheetTabToColumnNames[sheetSelect.value]) || [];
            CAMPAIGN_TOOLS.logger.log("addressSelect: element present?", !!addressSelect);
            CAMPAIGN_TOOLS.logger.log("sheetSelect.value:", sheetSelect.value);
            CAMPAIGN_TOOLS.logger.log("model.sheetTabToColumnNames:", model.sheetTabToColumnNames);
            CAMPAIGN_TOOLS.logger.log("columns for selected sheet:", columns);
            CAMPAIGN_TOOLS.logger.log("model.preferredAddressColumnName:", model.preferredAddressColumnName);
            addressSelect.innerHTML = columns.map((col: string) => `<option value="${col}">${col}</option>`).join("");
            addressSelect.value = model.preferredAddressColumnName;
            CAMPAIGN_TOOLS.logger.log("addressSelect.value just set to:", model.preferredAddressColumnName, "DOM value now:", addressSelect.value);
        }
        if (mapsApiKey) mapsApiKey.value = prefs.mapsApiKey;
        if (showLatLng) showLatLng.checked = !!prefs.showLatLong;
        if (debugChk) debugChk.checked = !!prefs.debug;

        CAMPAIGN_TOOLS.logger.log("populateDialogFields → sheetSelect.value =", sheetSelect ? sheetSelect.value : null);
        CAMPAIGN_TOOLS.logger.log("populateDialogFields → addressSelect.value =", addressSelect ? addressSelect.value : null);

        return sheetSelect;
    }


    function wireUpEventHandlers(model: any) {
        bindRequired("sheetSelect", "change", function (this: HTMLElement, _evt: Event) {
            CAMPAIGN_TOOLS.UI.onSheetChange(model);
        });
        bindRequired("saveBtn", "click", function (_evt: Event) {
            saveSettings(model);
        });
        bindRequired("showApiKey", "change", function (this: HTMLElement, _evt: Event) {
            CAMPAIGN_TOOLS.UI.toggleApiKeyVisibility(this);
        });
        bindRequired("mapsApiKey", "blur", function (_evt: Event) { CAMPAIGN_TOOLS.UI.hideApiKeyOnBlur(); });
        bindRequired("mapsApiKey", "focus", function (_evt: Event) { CAMPAIGN_TOOLS.UI.showApiKeyOnFocus(); });
        bindRequired("mapsApiKey", "input", function (_evt: Event) { CAMPAIGN_TOOLS.UI.updateSaveButtonState(); });
        bindRequired("addressSelect", "change", function (_evt: Event) { CAMPAIGN_TOOLS.UI.updateSaveButtonState(); });
    }

    /** Pass the model into renderers */
    function renderSelectorForAddressColumn(model: any, preferredSheetSelect: HTMLSelectElement | null) {
        if (model.sheetTabNames.length > 0 && preferredSheetSelect) {
            CAMPAIGN_TOOLS.UI.renderHeadersFor(preferredSheetSelect.value, model);
        }
        CAMPAIGN_TOOLS.UI.updateSaveButtonState();
        CAMPAIGN_TOOLS.UI.hideSpinner();
        CAMPAIGN_TOOLS.logger.log("onOpen processing DONE");
    }

    // Main entry point
    CAMPAIGN_TOOLS.logger = new (window as any).CAMPAIGN_TOOLS.CampaignToolsLogger(false);
    CAMPAIGN_TOOLS.logger.log("ENTER onOpen");
    CAMPAIGN_TOOLS.UI.showSpinner();
    const chain =
        google.script.run
            .withSuccessHandler(function (responseFromRemote: any) {
                // Set the model globally for logging and event handlers
                (window as any).CAMPAIGN_TOOLS_UI = (window as any).CAMPAIGN_TOOLS_UI || {};
                (window as any).CAMPAIGN_TOOLS_UI.model = responseFromRemote;
                CAMPAIGN_TOOLS.logger = new (window as any).CAMPAIGN_TOOLS.CampaignToolsLogger(responseFromRemote.prefs && responseFromRemote.prefs.debug);
                CAMPAIGN_TOOLS.logger.log("getInitData success", responseFromRemote);

                const sheetSelect = populateDialogFields(responseFromRemote);
                waitForUIHelpers().then(function () {
                    wireUpEventHandlers(responseFromRemote);
                    renderSelectorForAddressColumn(responseFromRemote, sheetSelect);
                });
            })
            .withFailureHandler(function (e: any) {
                console.error("❌ Failed to fetch init data:", e);
                CAMPAIGN_TOOLS.UI.hideSpinner();
            });
    chain.getInitData();
}

// ===== dialog controls =====
function closeDialog() {
    CAMPAIGN_TOOLS.logger.log("closeDialog");
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
    CAMPAIGN_TOOLS.logger.log("ENTER saveSettingsWith(model)");
    const btn = document.getElementById('saveBtn') as HTMLButtonElement | null;
    if (btn) btn.disabled = true;

    const sheetName = (document.getElementById("sheetSelect") as HTMLSelectElement | null)?.value || "";
    const address   = (document.getElementById("addressSelect") as HTMLSelectElement | null)?.value || "";
    const mapsKey   = (document.getElementById("mapsApiKey") as HTMLInputElement | null)?.value || "";
    const showLL    = !!((document.getElementById("showLatLng") as HTMLInputElement | null)?.checked);
    const debug     = !!((document.getElementById("debug") as HTMLInputElement | null)?.checked);

    const columns = (model.sheetTabToColumnNames && model.sheetTabToColumnNames[sheetName]) || [];

    const payload = {
        sheetTabName: sheetName,
        addressColumn: address,
        mapsApiKey: mapsKey,
        showLatLong: showLL,
        debug: debug
    };
    CAMPAIGN_TOOLS.logger.log("saveSettingsWith payload", payload, { columns });

    if (!mapsKey || !address) {
        if (btn) btn.disabled = true;
        console.error("❌ Missing required input(s):", { hasMapsKey: !!mapsKey, hasAddress: !!address });
        alert("❌ You must provide both a Maps API key and an Address column before saving.");
        return;
    }

    google.script.run
        .withSuccessHandler(function () {
            CAMPAIGN_TOOLS.logger.log("saveSettingsWith success → closing dialog");
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
    CAMPAIGN_TOOLS.logger.log("cancelDialog");
    closeDialog();
}

// ===== keyboard: ESC closes dialog =====
(function () {
    function onKeydown(e: KeyboardEvent) {
        if (e && (e.key === 'Escape' || e.key === 'Esc')) {
            e.preventDefault();
            e.stopPropagation();
            CAMPAIGN_TOOLS.logger.log("keyboard escape → cancelDialog");
            cancelDialog();
        }
    }
    window.addEventListener('keydown', onKeydown, true);
})();
