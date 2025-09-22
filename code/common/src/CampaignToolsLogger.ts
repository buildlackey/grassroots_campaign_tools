class CampaignToolsLogger {
    public clientMode: boolean;
    public isEnabled: boolean;
    private static _instance: CampaignToolsLogger | null = null;

    static getInstance(debug?: boolean): CampaignToolsLogger {
        if (!CampaignToolsLogger._instance) {
            CampaignToolsLogger._instance = new CampaignToolsLogger(debug);
        }
        return CampaignToolsLogger._instance;
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
        this.isEnabled = enabled;
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

//        if (this.clientMode) {
 //           console.log("fake client log: " + message);
  //      } else {
   //         Logger.log("fake server log: " + message);
    //    }

        // Note: In JSDOM, stack traces will show 'about:blank' and virtual line numbers, not real file/line info.
        // This is a limitation of JSDOM and cannot be worked around in pure JS.
        if (!this.isEnabled) return;
        let callSite = '';
        let callerSite = '';
        let fullStack = '';
        try {
            const err = new Error();
            if (err.stack) {
                fullStack = err.stack;
                const stackLines = err.stack.split('\n');
                if (stackLines.length > 2) {
                    callSite = stackLines[2].trim();
                }
                if (stackLines.length > 3) {
                    callerSite = stackLines[3].trim();
                }
            }
        } catch (e) {}
        var argsArr = Array.prototype.slice.call(arguments);
        function buildFullMsg(args: any[]): string {
            let fullMsg = '[' + callSite + (callerSite ? ' | ' + callerSite : '') + ']';
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
            // For debugging, also log the full stack trace
            console.log('Logger stack trace:', fullStack);
        } else {
            Logger.log(logMsg);
        }
    }

    ping(): string {
        return 'success';
    }
}

console.log("CampaignToolsLogger loaded and attached to globalThis.CAMPAIGN");
(globalThis as any).CAMPAIGN = (globalThis as any).CAMPAIGN || {};
(globalThis as any).CAMPAIGN.CampaignToolsLogger = CampaignToolsLogger;
