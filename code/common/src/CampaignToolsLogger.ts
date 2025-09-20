class CampaignToolsLogger {
    private clientMode: boolean;
    private isEnabled: boolean;

    static getEmitLogsFromConfig(): boolean {
        // Only works in Node/Jest, not GAS/browser
        try {
            if (typeof require === "function" && typeof process !== "undefined" && process.env && process.env.HOME) {
                var fs = require("fs");
                var path = require("path");
                var configPath = path.join(process.env.HOME, ".campaign", "test-config.json");
                var raw = fs.readFileSync(configPath, "utf8");
                var cfg = JSON.parse(raw);
                return !!cfg.emitLogs;
            }
        } catch (e) {}
        return false;
    }

    constructor(debug: boolean) {
        this.clientMode = (typeof Logger === "undefined");
        this.isEnabled = !!debug;
    }

    log(message: string, args?: any[]) {
        if (!this.isEnabled) return;
        if (this.clientMode) {
            var allArgs = [message];
            if (args && args.length) {
                for (var i = 0; i < args.length; i++) {
                    allArgs.push(args[i]);
                }
            }
            console.log.apply(console, allArgs);
        } else {
            if (args && args.length) {
                Logger.log(message + " " + args.join(" "));
            } else {
                Logger.log(message);
            }
        }
    }

    ping() {
        return 'success';
    }
}

(globalThis as any).CAMPAIGN = (globalThis as any).CAMPAIGN || {};
(globalThis as any).CAMPAIGN.CampaignToolsLogger = CampaignToolsLogger;
