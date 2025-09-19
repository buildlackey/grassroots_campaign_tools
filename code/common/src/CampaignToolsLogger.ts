class CampaignToolsLogger {
    private clientMode: boolean;
    private isEnabled: boolean;

    constructor(debug: boolean) {
        this.isEnabled = !!debug;
        this.clientMode = (typeof Logger === "undefined");
    }

    log(message: string, ...args: any[]) {
        if (!this.isEnabled) return;
        if (this.clientMode) {
            console.log(message, ...args);
        } else {
            Logger.log(message, ...args);
        }
    }
}

(globalThis as any).CAMPAIGN_TOOLS = (globalThis as any).CAMPAIGN_TOOLS || {};
(globalThis as any).CAMPAIGN_TOOLS.CampaignToolsLogger = CampaignToolsLogger;
