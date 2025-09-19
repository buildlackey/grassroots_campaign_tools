// @ts-nocheck

// Declare global extensions for window and jQuery
// This is necessary because the codebase relies on certain global objects and libraries,
// such as CAMPAIGN_TOOLS_UI and jQuery, which are not natively recognized by TypeScript.
//
interface Window {
    CAMPAIGN_TOOLS_UI?: {
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
    // Enhanced logger
    function logUIFrosting(msg: string, ...args: any[]): void {
        const debug =
            (window.CAMPAIGN_TOOLS_UI &&
                window.CAMPAIGN_TOOLS_UI.model &&
                window.CAMPAIGN_TOOLS_UI.model.prefs &&
                window.CAMPAIGN_TOOLS_UI.model.prefs.debug);
        if (debug) {
            console.log("[SettingsDialogUIFrostingCode]", msg, ...args);
        }
    }

    var SDH = global.SDH = global.SDH || {};
    SDH.UI = SDH.UI || {};
    SDH.UI.state = SDH.UI.state || {
        sheetTabToColumnNames: {},
        preferences: { addressColumn: {} }
    };

    // Spinner control
    SDH.UI.showSpinner = function () {
        try {
            const overlay = document.getElementById("loading-overlay");
            if (overlay) overlay.style.display = "flex";
        } catch (e) {
            console.warn("[safeShowLoading] failed:", e);
        }
    };
    SDH.UI.hideSpinner = function () {
        try {
            const overlay = document.getElementById("loading-overlay");
            if (overlay) overlay.style.display = "none";
        } catch (e) {
            console.warn("[safeHideLoading] failed:", e);
        }
    };

    // API key visibility
    SDH.UI.showApiKeyOnFocus = function () {
        const el = document.getElementById("mapsApiKey") as HTMLInputElement | null;
        if (!el) return;
        el.setAttribute("type", "text");
        logUIFrosting("[showApiKeyOnFocus] unmasked mapsApiKey field");
    };
    SDH.UI.hideApiKeyOnBlur = function () {
        const el = document.getElementById("mapsApiKey") as HTMLInputElement | null;
        if (!el) return;
        if (el.value && el.value.trim().length > 0) {
            el.setAttribute("type", "password");
            logUIFrosting("[hideApiKeyOnBlur] masked mapsApiKey field");
        } else {
            el.setAttribute("type", "text");
        }
    };
    SDH.UI.toggleApiKeyVisibility = function (checkboxEl: HTMLInputElement) {
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
    SDH.UI.initTooltips = function () {
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
    SDH.UI.waitForTooltipReady = function (maxMs, intervalMs) {
        var start = Date.now();
        (function tick() {
            if (window.jQuery && $.fn && $.fn.tooltip) { SDH.UI.initTooltips(); return; }
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
    SDH.UI.initMapsPopover = function () {
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
        SDH.UI._headBootstrapped = SDH.UI._headBootstrapped || false;
        SDH.UI.bootstrapHead = function () {
            if (SDH.UI._headBootstrapped) return;
            SDH.UI._headBootstrapped = true;
            try {
                window.addEventListener("error", function () { SDH.UI.hideSpinner(); });
                window.addEventListener("unhandledrejection", function () { SDH.UI.hideSpinner(); });
            } catch (_){}
            SDH.UI.showSpinner();
            SDH.UI.waitForTooltipReady(5000, 50);
            SDH.UI.initMapsPopover();
        };
        function runBootstrap() { SDH.UI.bootstrapHead(); }
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
    SDH.UI.updateSaveButtonState = function () {
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
    SDH.UI.renderHeadersFor = function (name: string, ctx?: any) {
        function formatOption(h: string) {
            return '<option value="%s">%s</option>'.replace(/%s/g, h);
        }
        logUIFrosting("[renderHeadersFor] start", name);
        var sheetTabToColumnNames = (ctx && ctx.sheetTabToColumnNames) || (SDH.UI.state.sheetTabToColumnNames || {});
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
        if (typeof SDH.UI.updateSaveButtonState === "function") {
            SDH.UI.updateSaveButtonState();
        }
        logUIFrosting("[renderHeadersFor] exit", { count: clean.length, selected: select.value });
    };

    /* === onSheetChange (now forwards optional ctx/model) === */
    SDH.UI.onSheetChange = function (ctx?: any) {
        var sel = document.getElementById("sheetSelect") as HTMLSelectElement | null;
        var name = sel ? sel.value : "";
        logUIFrosting("[onSheetChange] ->", name);
        SDH.UI.renderHeadersFor(name, ctx);
    };

    // Publish SDH before firing the ready event (prevents ReferenceError in listeners)
    global.SDH = SDH;

    // Sentinel ready
    SDH.UI.ready = true;
    try {
        var ev = document.createEvent("Event");
        ev.initEvent("sdh-ui-ready", true, true);
        document.dispatchEvent(ev);
    } catch (e) { }
    logUIFrosting("[SettingsDialogUIFrostingCode] sentinel set");
})(window);
