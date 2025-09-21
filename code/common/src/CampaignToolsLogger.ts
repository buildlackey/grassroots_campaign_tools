declare var Logger: any;


class CampaignToolsLogger {
    private clientMode: boolean;
    private isEnabled: boolean;

    static isLoggingEnabledFromLocalConfig(): boolean {
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

    constructor(debug?: boolean) {
        this.clientMode = (typeof Logger === "undefined");
        if (typeof debug === "boolean") {
            this.isEnabled = debug;
        } else if (this.clientMode) {   // if debug not passed, decide on debug mode by looking at client side config
            this.isEnabled = CampaignToolsLogger.isLoggingEnabledFromLocalConfig();
        } else {
            this.isEnabled = false;
        }
    }

    log(message: string, args?: any[]): void {
        if (!this.isEnabled) return;
        if (this.clientMode) {
            console.log(message);
            if (args && args.length) {
                args.forEach((arg: any) => {
                    console.log(arg);            // log a msg that will show up in the client side browser console
                });
            }
        } else {
            let fullMsg = message;
            if (args && args.length) {
                args.forEach((arg: any) => {
                    fullMsg += " " + arg;
                });
            }
            Logger.log(fullMsg);            // log a msg that will show in the GAS executions view
        }
    }

    log2(message: string, args?: any[]): void {
        if (!this.isEnabled) return;
        let callSite = '';
        try {
            const err = new Error();
            if (err.stack) {
                const stackLines = err.stack.split('\n');
                // stackLines[0] is 'Error', stackLines[1] is this function, stackLines[2] is the caller
                if (stackLines.length > 2) {
                    callSite = stackLines[2].trim();
                }
            }
        } catch (e) {}
        // You can now include callSite in your log output
        if (this.clientMode) {
            console.log(`[${callSite}]`, message, ...(args || []));
        } else {
            let fullMsg = `[${callSite}] ${message}`;
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