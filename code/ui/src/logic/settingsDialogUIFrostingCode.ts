export const SettingsDialogUIFrostingCode = {
    showSpinner: function () {
        const overlay = document.getElementById("loading-overlay");
        if (!overlay) return;
        overlay.style.display = "flex";
    },
    hideSpinner: function () {
        const overlay = document.getElementById("loading-overlay");
        if (!overlay) return;
        overlay.style.display = "none";
    },
    showApiKeyOnFocus: function () {
        const el = document.getElementById("mapsApiKey") as HTMLInputElement | null;
        if (!el) return;
        el.setAttribute("type", "text");
    },
    hideApiKeyOnBlur: function () {
        const el = document.getElementById("mapsApiKey") as HTMLInputElement | null;
        if (!el) return;
        if (el.value && el.value.trim().length > 0) {
            el.setAttribute("type", "password");
        } else {
            el.setAttribute("type", "text");
        }
    },
    toggleApiKeyVisibility: function (checkboxEl: HTMLInputElement) {
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
    },
    initMapsPopover: function () {
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
        function wire() {
            var btn = document.getElementById("maps-help-btn");
            var pop = document.getElementById("maps-help-popover");
            if (!btn || !pop) return;
            function openPop() {
                if (!pop || !btn) return;
                pop.classList.add("show");
                positionPopover(btn, pop);
                btn.setAttribute("aria-expanded", "true");
            }
            function closePop() {
                if (!pop || !btn) return;
                pop.classList.remove("show");
                btn.setAttribute("aria-expanded", "false");
            }
            function togglePop(e: Event) {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                if (!pop) return;
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
                if (pop && pop.classList.contains("show") && btn) positionPopover(btn, pop);
            });
            window.addEventListener("scroll", function () {
                if (pop && pop.classList.contains("show") && btn) positionPopover(btn, pop);
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
    }
};
