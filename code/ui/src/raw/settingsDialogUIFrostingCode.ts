// @ts-nocheck

// Declare global extensions for window and jQuery
// This is necessary because the codebase relies on certain global objects and libraries,
// such as CAMPAIGN_UI and jQuery, which are not natively recognized by TypeScript.
//
interface Window {
    CAMPAIGN_UI?: {
        model?: {
            prefs?: {
                debug?: boolean;
            };
        };
    };

    // Add jQuery property to Window interface as optional 'any' type.
    // Additionally, the $ variable is declared globally as any (below).
    // This is necessary because the project uses jQuery for DOM manipulation and tooltips,
    // but TypeScript does not natively recognize jQuery without explicit type definitions.
    jQuery?: any;
}
// Declare $ as any os as to avoid TypeScript errors while allowing jQuery.
declare const $: any;

(function (global) {
    // --- Namespace setup ---
    global.CAMPAIGN = global.CAMPAIGN || {};
    global.CAMPAIGN.UI = global.CAMPAIGN.UI || {};
    global.CAMPAIGN_UI = global.CAMPAIGN.UI;

    // Enhanced logger
    function logUIFrosting(msg: string, ...args: any[]): void {
        const debug =
            (window.CAMPAIGN_UI &&
                window.CAMPAIGN_UI.model &&
                window.CAMPAIGN_UI.model.prefs &&
                window.CAMPAIGN_UI.model.prefs.debug);
        if (debug) {
            console.log("[SettingsDialogUIFrostingCode]", msg, ...args);
        }
    }

    var UI = global.CAMPAIGN.UI;
    UI.state = UI.state || {
        sheetTabToColumnNames: {},
        preferences: { addressColumn: {} }
    };

    // Spinner control
    UI.showSpinner = function () {
        try {
            const overlay = document.getElementById("loading-overlay");
            if (overlay) overlay.style.display = "flex";
        } catch (e) {
            console.warn("[safeShowLoading] failed:", e);
        }
    };
    UI.hideSpinner = function () {
        try {
            const overlay = document.getElementById("loading-overlay");
            if (overlay) overlay.style.display = "none";
        } catch (e) {
            console.warn("[safeHideLoading] failed:", e);
        }
    };

    // API key visibility
    UI.showApiKeyOnFocus = function () {
        const el = document.getElementById("mapsApiKey") as HTMLInputElement | null;
        if (!el) return;
        el.setAttribute("type", "text");
        logUIFrosting("[showApiKeyOnFocus] unmasked mapsApiKey field");
    };
    UI.hideApiKeyOnBlur = function () {
        const el = document.getElementById("mapsApiKey") as HTMLInputElement | null;
        if (!el) return;
        if (el.value && el.value.trim().length > 0) {
            el.setAttribute("type", "password");
            logUIFrosting("[hideApiKeyOnBlur] masked mapsApiKey field");
        } else {
            el.setAttribute("type", "text");
        }
    };
    UI.toggleApiKeyVisibility = function (checkboxEl: HTMLInputElement) {
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
        logUIFrosting("[toggleApiKeyVisibility] type now:", el.getAttribute("type"));
    };

    // Tooltips
    UI.initTooltips = function () {
        var $target = $(".help-icon:not(.popover-help)");
        if ($target.length === 0) return;
        $target.tooltip({
            appendTo: "body",
            items: ".help-icon:not(.popover-help)",
            content: function () { return $(this).attr("data-help"); },
            position: {
                my: "left+8 bottom-8",
                at: "right top",
                within: window,
                collision: "flipfit"
            },
            tooltipClass: "custom-tooltip",
            track: false,
            show: { delay: 150, duration: 80 },
            hide: { delay: 100, duration: 80 }
        });
    };
    UI.waitForTooltipReady = function (maxMs, intervalMs) {
        var start = Date.now();
        (function tick() {
            if (window.jQuery && $.fn && $.fn.tooltip) { UI.initTooltips(); return; }
            if (Date.now() - start >= maxMs) return;
            setTimeout(tick, intervalMs);
        })();
    };

    // Popover logic
    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }
    function positionPopover(btn, pop) {
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
    UI.initMapsPopover = function () {
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
            function togglePop(e) {
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
    };

    // Bootstrap head logic
    (function () {
        UI._headBootstrapped = UI._headBootstrapped || false;
        UI.bootstrapHead = function () {
            if (UI._headBootstrapped) return;
            UI._headBootstrapped = true;
            try {
                window.addEventListener("error", function () { UI.hideSpinner(); });
                window.addEventListener("unhandledrejection", function () { UI.hideSpinner(); });
            } catch (_){}
            UI.showSpinner();
            UI.waitForTooltipReady(5000, 50);
            UI.initMapsPopover();
        };
        function runBootstrap() { UI.bootstrapHead(); }
        if (document.readyState === "complete") {
            runBootstrap();
        } else {
            window.addEventListener("load", function once() {
                window.removeEventListener("load", once);
                runBootstrap();
            });
        }
    })();

    logUIFrosting("[SettingsDialogUIFrostingCode] loading");
    /* === updateSaveButtonState === */
    UI.updateSaveButtonState = function () {
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
        logUIFrosting("[updateSaveButtonState] disabled?", btn.disabled);
    };

    /* === renderHeadersFor (now accepts optional ctx/model) === */
    UI.renderHeadersFor = function (name: string, ctx?: any) {
        function formatOption(h: string) {
            return '<option value="%s">%s</option>'.replace(/%s/g, h);
        }
        logUIFrosting("[renderHeadersFor] start", name);
        var sheetTabToColumnNames = (ctx && ctx.sheetTabToColumnNames) || (UI.state.sheetTabToColumnNames || {});
        var headers = (sheetTabToColumnNames && sheetTabToColumnNames[name]) || [];
        var clean = headers.filter((h: any) => h != null && String(h).length > 0).map((h: any) => String(h));
        var select = document.getElementById("addressSelect") as HTMLSelectElement | null;
        if (!select) {
            console.warn("[renderHeadersFor] addressSelect not found");
            return;
        }
        select.innerHTML = clean.map(formatOption).join('');
        select.value = ctx ? ctx.preferredAddressColumnName : "";
        logUIFrosting("[renderHeadersFor] selected:", select.value);
        if (typeof UI.updateSaveButtonState === "function") {
            UI.updateSaveButtonState();
        }
        logUIFrosting("[renderHeadersFor] exit", { count: clean.length, selected: select.value });
    };

    /* === onSheetChange (now forwards optional ctx/model) === */
    UI.onSheetChange = function (ctx?: any) {
        var sel = document.getElementById("sheetSelect") as HTMLSelectElement | null;
        var name = sel ? sel.value : "";
        logUIFrosting("[onSheetChange] ->", name);
        UI.renderHeadersFor(name, ctx);
    };

    // Sentinel ready
    UI.ready = true;
    try {
        var ev = document.createEvent("Event");
        ev.initEvent("ui-frosting-ready", true, true);
        document.dispatchEvent(ev);
    } catch (e) { }
    logUIFrosting("[SettingsDialogUIFrostingCode] sentinel set");
})(window);
