declare var Logger: any;

class CampaignToolsLogger {
    private clientMode: boolean;
    private isEnabled: boolean;
    private static _instance: CampaignToolsLogger | null = null;

    static getInstance(debug?: boolean): CampaignToolsLogger {
        if (!CampaignToolsLogger._instance) {
            CampaignToolsLogger._instance = new CampaignToolsLogger(debug);
        }
        return CampaignToolsLogger._instance.refreshEnabled();
    }

    private constructor(debug?: boolean) {
        this.clientMode = (typeof Logger === "undefined");
        if (typeof debug === "boolean") {
            this.isEnabled = debug;
        } else if (this.clientMode) {
            this.isEnabled = CampaignToolsLogger.isLoggingEnabledClientSideCheck();
        } else {
            // GAS environment: get debug from PreferenceSvc
            var svc = (globalThis as any).CAMPAIGN && (globalThis as any).CAMPAIGN.PreferenceSvc;
            if (!svc || typeof svc.create !== "function") {
                throw new Error("PreferenceSvc is not defined in GAS environment. Cannot determine logging preference.");
            }
            var prefs = svc.create().getPreferences();
            this.isEnabled = !!(prefs && prefs.debug);
        }
    }

    setEnabled(enabled: boolean) {
        // log input arg value with the correct statement for GAS environment or client-side
        if (this.clientMode) {
            console.log("CampaignToolsLogger - client: setEnabled called with", enabled);
        } else {
            Logger.log("_sys_logger: CampaignToolsLogger - server: setEnabled called with %s", enabled);
        }

        this.isEnabled = enabled;
    }


    getEnabled(): boolean {
        return this.isEnabled;
    }

    refreshEnabled() {
        if (this.clientMode) {
            this.isEnabled = CampaignToolsLogger.isLoggingEnabledClientSideCheck();
        } else {
            var svc = (globalThis as any).CAMPAIGN && (globalThis as any).CAMPAIGN.PreferenceSvc;
            if (!svc || typeof svc.create !== "function") {
                throw new Error("PreferenceSvc is not defined in GAS environment. Cannot determine logging preference.");
            }
            var prefs = svc.create().getPreferences();
            this.isEnabled = !!(prefs && prefs.debug);
        }

        return this;
    }


    static isLoggingEnabledClientSideCheck(): boolean {
        try {
            // Prefer localStorage in browser
            if (typeof localStorage !== "undefined" && localStorage.getItem("CAMPAIGN_TOOLS_ENABLE_LOGGING") !== null) {
                console.log("using local storage");
                return localStorage.getItem("CAMPAIGN_TOOLS_ENABLE_LOGGING") === "true";
            }

        } catch (e) {
            console.log("isLoggingEnabledClientSideCheck error!");
        }
        console.log("Fallback to globalThis for test/Jest");
        return !!(globalThis as any).CAMPAIGN_TOOLS_ENABLE_LOGGING;
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
if (typeof Logger !== "undefined") {
    Logger.log("_sys_logger: ✅ CampaignToolsLogger loaded and attached to globalThis.CAMPAIGN");
}

