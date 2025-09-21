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
            return !!(globalThis as any).CAMPAIGN_TOOLS_ENABLE_LOGGING;
        } catch (e) {
            return false;
        }
    }


    log(message: string): void {
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
        var argsArr = Array.prototype.slice.call(arguments);
        function buildFullMsg(args: any[]): string {
            let fullMsg = '[' + callSite + ']';
            args.forEach(function(arg: any) {
                if (Array.isArray(arg)) {
                    fullMsg += ' ' + JSON.stringify(arg);
                } else {
                    fullMsg += ' ' + String(arg);
                }
            });
            return fullMsg;
        }
        const logMsg = buildFullMsg(argsArr);
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
