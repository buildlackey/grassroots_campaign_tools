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
                return localStorage.getItem("CAMPAIGN_TOOLS_ENABLE_LOGGING") === "true";
            }

        } catch (e) {
            console.log("isLoggingEnabledClientSideCheck error!");
        }

        return !!(globalThis as any).CAMPAIGN_TOOLS_ENABLE_LOGGING;
    }

    private static getCallSite(depth: number = 3): string {
        try {
            const err = new Error();
            if (err.stack) {
                const stackLines = err.stack.split('\n');
                if (stackLines.length > depth) {
                    return stackLines[depth].trim();
                }
            }
        } catch (e) {}
        return '';
    }

    log(message: string, stackDepth?: number): void {
        if (!this.isEnabled) return;
        const depth = typeof stackDepth === 'number' ? stackDepth : 3;
        const callSite = CampaignToolsLogger.getCallSite(depth);
        // Always include the message in the output
        let fullMsg = '[' + callSite + '] ' + String(message);
        if (arguments.length > 2) {
            // If there are extra arguments, include them
            for (let i = 2; i < arguments.length; ++i) {
                const arg = arguments[i];
                if (Array.isArray(arg)) {
                    fullMsg += ' ' + JSON.stringify(arg);
                } else {
                    fullMsg += ' ' + String(arg);
                }
            }
        }
        if (this.clientMode) {
            console.log(fullMsg);
        } else {
            Logger.log(fullMsg);
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
