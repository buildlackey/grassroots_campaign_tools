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

    // Deprecate logUIFrosting and replace with CampaignToolsLogger
    // Remove logUIFrosting definition
    // Create a CampaignToolsLogger instance (logging off by default)
    const logger = new global.CAMPAIGN.CampaignToolsLogger();

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
        logger.log("[showApiKeyOnFocus] unmasked mapsApiKey field");
    };
    UI.hideApiKeyOnBlur = function () {
        const el = document.getElementById("mapsApiKey") as HTMLInputElement | null;
        if (!el) return;
        if (el.value && el.value.trim().length > 0) {
            el.setAttribute("type", "password");
            logger.log("[hideApiKeyOnBlur] masked mapsApiKey field");
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
        logger.log("[toggleApiKeyVisibility] type now:", el.getAttribute("type"));
    };

    // Tooltips

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

    logger.log("[SettingsDialogUIFrostingCode] loading");

    /* === renderHeadersFor (now accepts optional ctx/model) === */

    // Sentinel ready
    UI.ready = true;
    try {
        var ev = document.createEvent("Event");
        ev.initEvent("ui-frosting-ready", true, true);
        document.dispatchEvent(ev);
    } catch (e) { }
    logger.log("[SettingsDialogUIFrostingCode] sentinel set");
})(window);
