declare var CAMPAIGN: any;
declare var google: any;

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
function bindRequired(id: string, event: string, handler: EventListener): HTMLElement {
    var el = document.getElementById(id);
    if (!el) throw new Error(`Missing required element #${id}`);
    el.addEventListener(event, handler);
    CAMPAIGN.logger.log("bindRequired OK", { id, event });
    return el;
}
function waitForUIHelpers(): Promise<void> {
    return new Promise((resolve: () => void) => {
        try {
            if ((window as any).CAMPAIGN && (window as any).CAMPAIGN.UI && (window as any).CAMPAIGN.UI.ready === true) {
                resolve();
                return;
            }
            document.addEventListener("ui-frosting-ready", () => resolve(), { once: true });
        } catch (_) {
            resolve();
        }
    });
}
function updateSaveButtonState() {
    var btn = document.getElementById("saveBtn") as HTMLButtonElement | null;
    if (!btn) {
        console.warn("[updateSaveButtonState] Save button not found");
        return;
    }
    var mapsEl = document.getElementById("mapsApiKey") as HTMLInputElement | null;
    var key = (mapsEl && typeof mapsEl.value === "string") ? mapsEl.value.trim() : "";
    var addrEl = document.getElementById("addressSelect") as HTMLSelectElement | null;
    var addr = (addrEl && typeof addrEl.value === "string") ? addrEl.value : "";
    btn.disabled = !(key.length > 0 && addr !== "");
    CAMPAIGN.logger.log("[updateSaveButtonState] disabled?", btn.disabled);
}
function renderHeadersFor(name: string, ctx?: any) {
    function formatOption(h: string) {
        return '<option value="%s">%s</option>'.replace(/%s/g, h);
    }
    CAMPAIGN.logger.log("[renderHeadersFor] start", name);
    var sheetTabToColumnNames = (ctx && ctx.sheetTabToColumnNames) || ((window as any).CAMPAIGN_UI?.model?.sheetTabToColumnNames || {});
    var headers = (sheetTabToColumnNames && sheetTabToColumnNames[name]) || [];
    var clean = headers.filter((h: any) => h != null && String(h).length > 0).map((h: any) => String(h));
    var select = document.getElementById("addressSelect") as HTMLSelectElement | null;
    if (!select) {
        console.warn("[renderHeadersFor] addressSelect not found");
        return;
    }
    select.innerHTML = clean.map(formatOption).join('');
    select.value = ctx ? ctx.preferredAddressColumnName : "";
    CAMPAIGN.logger.log("[renderHeadersFor] selected:", select.value);
    updateSaveButtonState();
    CAMPAIGN.logger.log("[renderHeadersFor] exit", { count: clean.length, selected: select.value });
}

// --- Public API ---
function populateDialogFields(model: any): HTMLSelectElement | null {
    CAMPAIGN.logger.log("populateDialogFields → model =", model);
    const prefs = model.prefs || {};
    const sheetSelect   = document.getElementById("sheetSelect") as HTMLSelectElement | null;
    const addressSelect = document.getElementById("addressSelect") as HTMLSelectElement | null;
    const mapsApiKey    = document.getElementById("mapsApiKey") as HTMLInputElement | null;
    const showLatLng    = document.getElementById("showLatLng") as HTMLInputElement | null;
    const debugChk      = document.getElementById("debug") as HTMLInputElement | null;
    if (sheetSelect) {
        sheetSelect.innerHTML = (model.sheetTabNames || [])
            .map((n: string) => `<option value="${n}">${n}</option>`)
            .join("");
        sheetSelect.value = model.preferredSheetTabName;
    }
    if (addressSelect && sheetSelect) {
        const columns = (model.sheetTabToColumnNames && model.sheetTabToColumnNames[sheetSelect.value]) || [];
        addressSelect.innerHTML = columns.map((col: string) => `<option value="${col}">${col}</option>`).join("");
        addressSelect.value = model.preferredAddressColumnName;
    }
    if (mapsApiKey) mapsApiKey.value = prefs.mapsApiKey;
    if (showLatLng) showLatLng.checked = !!prefs.showLatLong;
    if (debugChk) debugChk.checked = !!prefs.debug;
    CAMPAIGN.logger.log("populateDialogFields → sheetSelect.value =", sheetSelect ? sheetSelect.value : null);
    CAMPAIGN.logger.log("populateDialogFields → addressSelect.value =", addressSelect ? addressSelect.value : null);
    return sheetSelect;
}
function wireUpEventHandlers(model: any) {
    bindRequired("sheetSelect", "change", function (this: HTMLElement, _evt: Event) {
        onSheetChange(model);
    });
    bindRequired("saveBtn", "click", function (_evt: Event) {
        saveSettings(model);
    });
    bindRequired("showApiKey", "change", function (this: HTMLElement, _evt: Event) {
        CAMPAIGN.UI.toggleApiKeyVisibility(this);
    });
    bindRequired("mapsApiKey", "blur", function (_evt: Event) { CAMPAIGN.UI.hideApiKeyOnBlur(); });
    bindRequired("mapsApiKey", "focus", function (_evt: Event) { CAMPAIGN.UI.showApiKeyOnFocus(); });
    bindRequired("mapsApiKey", "input", function (_evt: Event) { updateSaveButtonState(); });
    bindRequired("addressSelect", "change", function (_evt: Event) { updateSaveButtonState(); });
}
function renderSelectorForAddressColumn(model: any, preferredSheetSelect: HTMLSelectElement | null) {
    if (model.sheetTabNames.length > 0 && preferredSheetSelect) {
        renderHeadersFor(preferredSheetSelect.value, model);
    }
    updateSaveButtonState();
    CAMPAIGN.UI.hideSpinner();
    CAMPAIGN.logger.log("onOpen processing DONE");
}
function closeDialog() {
    CAMPAIGN.logger.log("closeDialog");
    try {
        if (google && google.script && google.script.host && typeof google.script.host.close === 'function') {
            google.script.host.close();
            return;
        }
    } catch (_) {}
    const c = document.getElementById('settings-dialog-container') || document.body;
    c.style.display = 'none';
}
function saveSettings(model: any, _evt?: Event) {
    CAMPAIGN.logger.log("ENTER saveSettingsWith(model)");
    const btn = document.getElementById('saveBtn') as HTMLButtonElement | null;
    if (btn) btn.disabled = true;
    const sheetName = (document.getElementById("sheetSelect") as HTMLSelectElement | null)?.value || "";
    const address   = (document.getElementById("addressSelect") as HTMLSelectElement | null)?.value || "";
    const mapsKey   = (document.getElementById("mapsApiKey") as HTMLInputElement | null)?.value || "";
    const showLL    = !!((document.getElementById("showLatLng") as HTMLInputElement | null)?.checked);
    const debug     = !!((document.getElementById("debug") as HTMLInputElement | null)?.checked);
    const columns = (model.sheetTabToColumnNames && model.sheetTabToColumnNames[sheetName]) || [];
    if (!mapsKey || !address) {
        if (btn) btn.disabled = true;
        console.error("❌ Missing required input(s):", { hasMapsKey: !!mapsKey, hasAddress: !!address });
        alert("❌ You must provide both a Maps API key and an Address column before saving.");
        return;
    }
    const payload = {
        sheetTabName: sheetName,
        addressColumn: address,
        mapsApiKey: mapsKey,
        showLatLong: showLL,
        debug: debug
    };
    if (typeof localStorage !== "undefined") {
        localStorage.setItem("CAMPAIGN_TOOLS_ENABLE_LOGGING", debug ? "true" : "false");
        CAMPAIGN.logger.setEnabled(debug);
    }
    CAMPAIGN.logger.log("saveSettingsWith payload", payload, { columns });
    google.script.run
        .withSuccessHandler(function () {
            CAMPAIGN.logger.log("saveSettingsWith success → closing dialog");
            closeDialog();
        })
        .withFailureHandler(function (e: any) {
            console.error("❌ Failed to save preferences: " +  e.message);
            const btn = document.getElementById('saveBtn') as HTMLButtonElement | null;
            if (btn) btn.disabled = false;
            alert("Failed to save preferences.");
        })
        .savePreferences(payload, columns);
}
function cancelDialog() {
    CAMPAIGN.logger.log("cancelDialog");
    closeDialog();
}
function onSheetChange(ctx?: any) {
    var sel = document.getElementById("sheetSelect") as HTMLSelectElement | null;
    var name = sel ? sel.value : "";
    CAMPAIGN.logger.log("[onSheetChange] ->", name);
    renderHeadersFor(name, ctx);
}
function registerEscHandler() {
    function onKeydown(e: KeyboardEvent) {
        if (e && (e.key === 'Escape' || e.key === 'Esc')) {
            e.preventDefault();
            e.stopPropagation();
            CAMPAIGN.logger.log("keyboard escape → cancelDialog");
            cancelDialog();
        }
    }
    window.addEventListener('keydown', onKeydown, true);
}
function onOpen(): void {
    CAMPAIGN.logger.log("ENTER onOpen");
    CAMPAIGN.UI.showSpinner();
    const chain =
        google.script.run
            .withSuccessHandler(function (responseFromRemote: any) {
                (window as any).CAMPAIGN_UI = (window as any).CAMPAIGN_UI || {};
                (window as any).CAMPAIGN_UI.model = responseFromRemote;
                CAMPAIGN.logger.log("getInitData success", responseFromRemote);
                const sheetSelect = populateDialogFields(responseFromRemote);
                waitForUIHelpers().then(function () {
                    wireUpEventHandlers(responseFromRemote);
                    renderSelectorForAddressColumn(responseFromRemote, sheetSelect);
                    registerEscHandler(); // Register ESC key handler on dialog open
                });
            })
            .withFailureHandler(function (e: any) {
                console.error("❌ Failed to fetch init data:", e);
                CAMPAIGN.UI.hideSpinner();
            });
    chain.getInitData();
}
window.addEventListener("load", onOpen);

export const SettingsDialogActionCode = {
    populateDialogFields,
    wireUpEventHandlers,
    renderSelectorForAddressColumn,
    closeDialog,
    saveSettings,
    cancelDialog,
    onSheetChange,
    registerEscHandler,
    onOpen,
    updateSaveButtonState,
    renderHeadersFor
};
