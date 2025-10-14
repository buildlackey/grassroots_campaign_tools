// @ts-nocheck
import { CampaignToolsLogger } from '../../../common/src/CampaignToolsLogger';

declare const $: any;

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}
function positionPopover(btn: HTMLElement, pop: HTMLElement) {
    var rect = btn.getBoundingClientRect();
    var bodyScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    var bodyScrollX = window.scrollX || document.documentElement.scrollLeft || 0;
    var w = pop.offsetWidth || 0;
    var h = pop.offsetHeight || 0;
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var left = rect.left + bodyScrollX + rect.width + 10;
    var top  = rect.top  + bodyScrollY + (rect.height / 2) - (h / 2);
    left = clamp(left, bodyScrollX + 8, bodyScrollX + vw - w - 8);
    top  = clamp(top,  bodyScrollY + 8, bodyScrollY + vh - h - 8);
    pop.style.left = left + "px";
    pop.style.top  = top  + "px";
}

export const SettingsDialogUIFrostingCode = {
    UIState: {
        sheetTabToColumnNames: {},
        preferences: { addressColumn: {} },
        ready: false,
        _headBootstrapped: false
    },
    logger: new CampaignToolsLogger(),
    showSpinner() {
        try {
            const overlay = document.getElementById("loading-overlay");
            if (overlay) overlay.style.display = "flex";
        } catch (e) {
            console.warn("[safeShowLoading] failed:", e);
        }
    },
    hideSpinner() {
        try {
            const overlay = document.getElementById("loading-overlay");
            if (overlay) overlay.style.display = "none";
        } catch (e) {
            console.warn("[safeHideLoading] failed:", e);
        }
    },
    showApiKeyOnFocus() {
        const el = document.getElementById("mapsApiKey") as HTMLInputElement | null;
        if (!el) return;
        el.setAttribute("type", "text");
        this.logger.log("[showApiKeyOnFocus] unmasked mapsApiKey field");
    },
    hideApiKeyOnBlur() {
        const el = document.getElementById("mapsApiKey") as HTMLInputElement | null;
        if (!el) return;
        if (el.value && el.value.trim().length > 0) {
            el.setAttribute("type", "password");
            this.logger.log("[hideApiKeyOnBlur] masked mapsApiKey field");
        } else {
            el.setAttribute("type", "text");
        }
    },
    toggleApiKeyVisibility(checkboxEl: HTMLInputElement) {
        const el = document.getElementById("mapsApiKey") as HTMLInputElement | null;
        if (!el) return;
        if (checkboxEl && checkboxEl.checked) {
            el.setAttribute("type", "text");
        } else {
            if (el.value && el.value.trim().length > 0) {
                el.setAttribute("type", "password");
            } else {
                el.setAttribute("type", "text");
            }
        }
        this.logger.log("[toggleApiKeyVisibility] type now:", el.getAttribute("type"));
    },
    initMapsPopover() {
        function wire() {
            var btn = document.getElementById("maps-help-btn");
            var pop = document.getElementById("maps-help-popover");
            if (!btn || !pop) return;
            function openPop() {
                pop.classList.add("show");
                positionPopover(btn, pop);
                btn.setAttribute("aria-expanded", "true");
            }
            function closePop() {
                pop.classList.remove("show");
                btn.setAttribute("aria-expanded", "false");
            }
            function togglePop(e: Event) {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                var showing = pop.classList.contains("show");
                if (showing) closePop(); else openPop();
            }
            btn.addEventListener("click", togglePop);
            var closeBtn = pop.querySelector(".popover-close");
            if (closeBtn) {
                closeBtn.addEventListener("click", function (e) {
                    e.preventDefault(); e.stopPropagation();
                    closePop();
                });
            }
            window.addEventListener("resize", function () {
                if (pop.classList.contains("show")) positionPopover(btn, pop);
            });
            window.addEventListener("scroll", function () {
                if (pop.classList.contains("show")) positionPopover(btn, pop);
            }, true);
        }
        if (document.readyState === "complete") {
            wire();
        } else {
            window.addEventListener("load", function once() {
                window.removeEventListener("load", once);
                wire();
            });
        }
    },
    bootstrapHead() {
        if (this.UIState._headBootstrapped) return;
        this.UIState._headBootstrapped = true;
        try {
            window.addEventListener("error", () => { this.hideSpinner(); });
            window.addEventListener("unhandledrejection", () => { this.hideSpinner(); });
        } catch (_){}
        this.showSpinner();
        // If you need tooltip ready logic, call it here
        this.initMapsPopover();
        this.logger.log("[SettingsDialogUIFrostingCode] loading");
        this.UIState.ready = true;
        try {
            var ev = document.createEvent("Event");
            ev.initEvent("ui-frosting-ready", true, true);
            document.dispatchEvent(ev);
        } catch (e) { }
        this.logger.log("[SettingsDialogUIFrostingCode] sentinel set");
    },
    updateSaveButtonState() {
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
        this.logger.log("[updateSaveButtonState] disabled?", btn.disabled);
    },
    renderHeadersFor(name: string, ctx?: any) {
        function formatOption(h: string) {
            return '<option value="%s">%s</option>'.replace(/%s/g, h);
        }
        this.logger.log("[renderHeadersFor] start", name);
        var sheetTabToColumnNames = (ctx && ctx.sheetTabToColumnNames) || (this.UIState.sheetTabToColumnNames || {});
        var headers = (sheetTabToColumnNames && sheetTabToColumnNames[name]) || [];
        var clean = headers.filter((h: any) => h != null && String(h).length > 0).map((h: any) => String(h));
        var select = document.getElementById("addressSelect") as HTMLSelectElement | null;
        if (!select) {
            console.warn("[renderHeadersFor] addressSelect not found");
            return;
        }
        select.innerHTML = clean.map(formatOption).join('');
        select.value = ctx ? ctx.preferredAddressColumnName : "";
        this.logger.log("[renderHeadersFor] selected:", select.value);
        if (typeof this.updateSaveButtonState === "function") {
            this.updateSaveButtonState();
        }
        this.logger.log("[renderHeadersFor] exit", { count: clean.length, selected: select.value });
    },
    onSheetChange(ctx?: any) {
        var sel = document.getElementById("sheetSelect") as HTMLSelectElement | null;
        var name = sel ? sel.value : "";
        this.logger.log("[onSheetChange] ->", name);
        this.renderHeadersFor(name, ctx);
    }
};

// Sentinel ready
SettingsDialogUIFrostingCode.UIState.ready = true;
try {
    var ev = document.createEvent("Event");
    ev.initEvent("ui-frosting-ready", true, true);
    document.dispatchEvent(ev);
} catch (e) { }
SettingsDialogUIFrostingCode.logger.log("[SettingsDialogUIFrostingCode] sentinel set");

// Optionally auto-bootstrap
SettingsDialogUIFrostingCode.bootstrapHead();
