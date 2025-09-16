import {CampaignToolsModelState} from "../../../common/src/CampaignToolsModel";
import {Preferences} from "../../../common/src/PreferenceSvc";


export class CampaignToolsModel {
    sheetTabNames: string[];
    sheetTabToColumnNames: Record<string, string[]>;
    prefs: Preferences;

    constructor(initData: CampaignToolsModelState) {
        this.sheetTabNames = initData.sheetTabNames || [];
        this.sheetTabToColumnNames = initData.sheetTabToColumnNames || {};
        this.prefs = initData.prefs;
    }

    getModelState(): CampaignToolsModelState {
        return {
            sheetTabNames: this.sheetTabNames,
            sheetTabToColumnNames: this.sheetTabToColumnNames,
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
        const headers = this.sheetTabToColumnNames[this.preferredSheetTabName] || [];
        const clean = headers.filter(h => h != null && String(h).length > 0).map(String);

        // Logging: show headers and clean list
        try {
            console.log('[CampaignToolsModel] preferredAddressColumnName: headers =', headers);
            console.log('[CampaignToolsModel] preferredAddressColumnName: clean =', clean);
            console.log('[CampaignToolsModel] preferredAddressColumnName: prefs.addressColumn =', this.prefs.addressColumn);
        } catch (e) {}

        if (this.prefs.addressColumn && clean.includes(this.prefs.addressColumn)) {
            try { console.log('[CampaignToolsModel] preferredAddressColumnName: returning prefs.addressColumn'); } catch (e) {}
            return this.prefs.addressColumn;
        }
        const match = clean.find(h => /address/i.test(h));
        if (match) {
            try { console.log('[CampaignToolsModel] preferredAddressColumnName: returning match =', match); } catch (e) {}
            return match;
        }

        try { console.log('[CampaignToolsModel] preferredAddressColumnName: returning clean[0] =', clean[0] || ''); } catch (e) {}
        return clean[0] || "";
    }

    get headersForPreferredSheet(): string[] {
        return this.sheetTabToColumnNames[this.preferredSheetTabName] || [];
    }

    // Remove static fromGAS for testability
}

/* ===== UMD-ish export: attach to globalThis for GAS runtime ===== */
(globalThis as any).CAMPAIGN_TOOLS = (globalThis as any).CAMPAIGN_TOOLS || {};
(globalThis as any).CAMPAIGN_TOOLS.CampaignToolsModel = CampaignToolsModel;

// GAS-only static method for runtime
(globalThis as any).CAMPAIGN_TOOLS.CampaignToolsModel.fromGAS = function(prefs: Preferences) {
    const effectivePrefs =
         prefs ||
         ((globalThis as any).CAMPAIGN_TOOLS &&
          (globalThis as any).CAMPAIGN_TOOLS.PreferenceSvc &&
          (globalThis as any).CAMPAIGN_TOOLS.PreferenceSvc.create().getPreferences());
    if (!effectivePrefs) {
        throw new Error("Preferences unavailable: must pass prefs or have PreferenceSvc loaded");
    }
    const sheetLayout = new (globalThis as any).CAMPAIGN_TOOLS.SheetLayout();
    const layout = sheetLayout.discover();

    return new CampaignToolsModel({
      sheetTabNames: layout.sheetTabNames,
      sheetTabToColumnNames: layout.sheetTabToColumnNames,
      prefs: effectivePrefs,
    });
};


