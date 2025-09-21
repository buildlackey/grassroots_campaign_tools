declare var Logger: any;


class CampaignToolsLogger {
    private clientMode: boolean;
    private isEnabled: boolean;

    static getEmitLogsFromConfig(): boolean {
        try {
            if (typeof require === "function" && typeof process !== "undefined" && process.env && process.env.HOME) {
                const fs = require("fs");
                const path = require("path");
                const configPath = path.join(process.env.HOME, ".campaign", "test-config.json");
                const raw = fs.readFileSync(configPath, "utf8");
                const cfg = JSON.parse(raw);
                return !!cfg.emitLogs;
            }
        } catch (e) {}
        return false;
    }

    constructor(debug: boolean) {
        this.clientMode = (typeof Logger === "undefined");
        this.isEnabled = !!debug;
    }

    log(message: string, args?: any[]): void {
        if (!this.isEnabled) return;
        if (this.clientMode) {
            console.log(message);
            if (args && args.length) {
                args.forEach((arg: any) => {
                    console.log(arg);
                });
            }
        } else {
            let fullMsg = message;
            if (args && args.length) {
                args.forEach((arg: any) => {
                    fullMsg += " " + arg;
                });
            }
            Logger.log(fullMsg);
        }
    }

    ping(): string {
        return 'success';
    }
}

// Type assertion for global assignment
(globalThis as any).CAMPAIGN = (globalThis as any).CAMPAIGN || {};
(globalThis as any).CAMPAIGN.CampaignToolsLogger = CampaignToolsLogger;