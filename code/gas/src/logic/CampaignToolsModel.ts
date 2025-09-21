import {CampaignToolsModelState} from "../../../common/src/CampaignToolsModel";
import {Preferences} from "../../../common/src/PreferenceSvc";


export class CampaignToolsModel {
    sheetTabNames: string[];
    sheetTabToColumnNames: Record<string, string[]>;
    prefs: Preferences;
    private logger: any;

    constructor(initData: CampaignToolsModelState) {
        this.sheetTabNames = initData.sheetTabNames || [];
        this.sheetTabToColumnNames = initData.sheetTabToColumnNames || {};
        this.prefs = initData.prefs;
        // Use global logger if available, else create a stub that ignores log calls and won't crash
        this.logger = (globalThis as any).CAMPAIGN?.CampaignToolsLogger
            ? new (globalThis as any).CAMPAIGN.CampaignToolsLogger()
            : { log: () => {} };
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
            this.logger.log('[CampaignToolsModel] preferredAddressColumnName: headers =', headers);
            this.logger.log('[CampaignToolsModel] preferredAddressColumnName: clean =', clean);
            this.logger.log('[CampaignToolsModel] preferredAddressColumnName: prefs.addressColumn =', this.prefs.addressColumn);
        } catch (e) {}

        if (this.prefs.addressColumn && clean.includes(this.prefs.addressColumn)) {
            this.logger.log('[CampaignToolsModel] preferredAddressColumnName: returning prefs.addressColumn');
            return this.prefs.addressColumn;
        }
        const match = clean.find(h => /address/i.test(h));
        if (match) {
            this.logger.log('[CampaignToolsModel] preferredAddressColumnName: returning match =', match);
            return match;
        }
        this.logger.log('[CampaignToolsModel] preferredAddressColumnName: returning clean[0] =', clean[0] || '');
        return clean[0] || "";
    }

    get headersForPreferredSheet(): string[] {
        return this.sheetTabToColumnNames[this.preferredSheetTabName] || [];
    }

    // Remove static fromGAS for testability
}

/* ===== UMD-ish export: attach to globalThis for GAS runtime ===== */
(globalThis as any).CAMPAIGN = (globalThis as any).CAMPAIGN || {};
(globalThis as any).CAMPAIGN.CampaignToolsModel = CampaignToolsModel;

// GAS-only static method for runtime
(globalThis as any).CAMPAIGN.CampaignToolsModel.fromGAS = function(prefs: Preferences) {
    const effectivePrefs =
         prefs ||
         ((globalThis as any).CAMPAIGN &&
          (globalThis as any).CAMPAIGN.PreferenceSvc &&
          (globalThis as any).CAMPAIGN.PreferenceSvc.create().getPreferences());
    if (!effectivePrefs) {
        throw new Error("Preferences unavailable: must pass prefs or have PreferenceSvc loaded");
    }
    const sheetLayout = new (globalThis as any).CAMPAIGN.SheetLayout();
    const layout = sheetLayout.discover();

    return new CampaignToolsModel({
      sheetTabNames: layout.sheetTabNames,
      sheetTabToColumnNames: layout.sheetTabToColumnNames,
      prefs: effectivePrefs,
    });
};
