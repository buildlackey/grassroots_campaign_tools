declare const $: any;

export const GenericUIFrostingCode = {
    initTooltips: function() {
        var $target = $(".help-icon:not(.popover-help)");
        if ($target.length === 0) return;
        $target.tooltip({
            appendTo: "body",
            items: ".help-icon:not(.popover-help)",
            content: function () { return $(this).getAttribute("data-help"); },
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
    },
    waitForTooltipReady: function(maxMs: number, intervalMs: number) {
        var start = Date.now();
        (function tick() {
            if ((window as any).jQuery && $.fn && $.fn.tooltip) { GenericUIFrostingCode.initTooltips(); return; }
            if (Date.now() - start >= maxMs) return;
            setTimeout(tick, intervalMs);
        })();
    }
};

window.addEventListener("load", function () {
    if ((window as any).CAMPAIGN && (window as any).CAMPAIGN.UI && typeof GenericUIFrostingCode.waitForTooltipReady === "function") {
        GenericUIFrostingCode.waitForTooltipReady(5000, 50);
    }
});
