// No imports here — relies on ambient Preferences from PreferenceSvc.d.ts

class CampaignToolsModel {
    sheetTabNames: string[];
    headersBySheet: Record<string, string[]>;
    prefs: Preferences;

    constructor(initData: CampaignToolsModelState) {
        this.sheetTabNames = initData.sheetTabNames || [];
        this.headersBySheet = initData.sheetTabToColumnNames || {};
        this.prefs = initData.prefs;
    }

    getModelState(): CampaignToolsModelState {
        return {
            sheetTabNames: this.sheetTabNames,
            sheetTabToColumnNames: this.headersBySheet,
            prefs: this.prefs,
            preferredSheetTabName: this.preferredSheetTabName,
            preferredAddressColumnName: this.preferredAddressColumnName,
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
        return ""; // paranoia fallback
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

    /** Factory: build a model from GAS sheet utils + caller-supplied prefs */
    static fromGAS(prefs?: Preferences): CampaignToolsModel {
        const effectivePrefs =
             prefs ||
             ((globalThis as any).CAMPAIGN_TOOLS &&
              (globalThis as any).CAMPAIGN_TOOLS.PreferenceSvc &&
              (globalThis as any).CAMPAIGN_TOOLS.PreferenceSvc.create().getPreferences());
        if (!effectivePrefs) {
            throw new Error("Preferences unavailable: must pass prefs or have PreferenceSvc loaded");
        }

        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheetLayout = new (globalThis as any).CAMPAIGN_TOOLS.SheetLayout(ss);
        const layout = sheetLayout.discover();

        return new CampaignToolsModel({
          sheetTabNames: layout.sheetTabNames,
          sheetTabToColumnNames: layout.sheetTabToColumnNames,
          prefs: effectivePrefs,
        });


    }
}

/* ===== UMD-ish export: attach to globalThis for GAS runtime ===== */
(globalThis as any).CAMPAIGN_TOOLS = (globalThis as any).CAMPAIGN_TOOLS || {};
(globalThis as any).CAMPAIGN_TOOLS.CampaignToolsModel = CampaignToolsModel;
