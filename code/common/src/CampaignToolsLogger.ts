declare var Logger: any;

class CampaignToolsLogger {
    public clientMode: boolean;
    public isEnabled: boolean;

    constructor(debug?: boolean) {
        this.clientMode = (typeof Logger === "undefined");
        if (typeof debug === "boolean") {
            this.isEnabled = debug;
        } else if (this.clientMode) {
            this.isEnabled = CampaignToolsLogger.isLoggingEnabledFromLocalConfig();
        } else {
            this.isEnabled = false;
        }
    }

    static isLoggingEnabledFromLocalConfig(): boolean {
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


    log(message: string, args?: any[]): void {
        if (!this.isEnabled) return;
        let callSite = '';
        try {
            const err = new Error();
            if (err.stack) {
                const stackLines = err.stack.split('\n');
                if (stackLines.length > 2) {
                    callSite = stackLines[2].trim();
                }
            }
        } catch (e) {}
        function buildFullMsg(baseMsg: string, args?: any[]): string {
            let fullMsg = baseMsg;
            if (args && args.length) {
                args.forEach(function(arg: any) {
                    fullMsg += ' ' + arg;
                });
            }
            return fullMsg;
        }
        const logMsg = buildFullMsg('[' + callSite + '] ' + message, args);
        if (this.clientMode) {
            console.log(logMsg);
        } else {
            Logger.log(logMsg);
        }
    }

    ping(): string {
        return 'success';
    }
}

(globalThis as any).CAMPAIGN = (globalThis as any).CAMPAIGN || {};
(globalThis as any).CAMPAIGN.CampaignToolsLogger = CampaignToolsLogger;
