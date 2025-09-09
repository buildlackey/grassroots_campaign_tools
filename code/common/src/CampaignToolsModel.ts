/// <reference path="./PreferenceSvc.d.ts" />


interface CampaignInitData {
    sheetTabNames: string[];
    sheetTabToColumnNames: Record<string, string[]>;
    prefs: Preferences;
}

class CampaignToolsModel {
    sheetTabNames: string[];
    headersBySheet: Record<string, string[]>;
    prefs: Preferences;

    constructor(initData: CampaignInitData) {
        this.sheetTabNames = initData.sheetTabNames || [];
        this.headersBySheet = initData.sheetTabToColumnNames || {};
        this.prefs = initData.prefs;
    }

    asJson(): CampaignInitData {
        return {
            sheetTabNames: this.sheetTabNames,
            sheetTabToColumnNames: this.headersBySheet,
            prefs: this.prefs,
        };
    }


    get preferredSheetTabName(): string {
        const preferred = this.prefs.sheetTabName;
        if (preferred && this.sheetTabNames.includes(preferred)) {
            return preferred;
        }
        if (this.sheetTabNames.length > 0) {
            return this.sheetTabNames[0];
        }
        return ""; // explicit fallback when no sheets at all  - don't think this is possible... but paranoia, right?
    }


    get preferredAddressColumnName(): string {
        const headers = this.headersBySheet[this.preferredSheetTabName] || [];
        const clean = headers.filter(h => h != null && String(h).length > 0).map(String);

        if (this.prefs.addressColumn && clean.includes(this.prefs.addressColumn)) {
            return this.prefs.addressColumn;
        }
        const match = clean.find(h => /address/i.test(h));
        if (match) return match;

        return clean[0] || "";
    }

    get headersForPreferredSheet(): string[] {
        return this.headersBySheet[this.preferredSheetTabName] || [];
    }

}

/* ===== UMD-ish export: attach to globalThis for GAS runtime ===== */
(globalThis as any).CAMPAIGN_TOOLS = (globalThis as any).CAMPAIGN_TOOLS || {};
(globalThis as any).CAMPAIGN_TOOLS.CampaignToolsModel = CampaignToolsModel;


