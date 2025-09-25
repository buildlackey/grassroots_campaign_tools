import {CampaignToolsModelState} from "../../../common/src/CampaignToolsModel";
import {Preferences} from "../../../common/src/PreferenceSvc";
import {SheetLayoutSummary} from "./SheetLayout";

require("../../../gas/src/logic/SheetLayout");


export class CampaignToolsModel {
    sheetTabNames: string[];
    sheetTabToColumnNames: Record<string, string[]>;
    prefs: Preferences;
    private logger: any;

    constructor(layoutSummary: SheetLayoutSummary, prefs: Preferences) {
        this.sheetTabNames = layoutSummary.sheetTabNames || [];
        this.sheetTabToColumnNames = layoutSummary.sheetTabToColumnNames || {};
        this.prefs = prefs;
        this.logger = (globalThis as any).CAMPAIGN && (globalThis as any).CAMPAIGN.CampaignToolsLogger ? (globalThis as any).CAMPAIGN.CampaignToolsLogger.getInstance() : null;
    }

    getModelState(): CampaignToolsModelState {  // might rename this to getSettingsDialogState   CampaignToolsModelState -> SettingsDialogState
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
        var headers = this.sheetTabToColumnNames[this.preferredSheetTabName] || [];
        var clean = headers.filter(function(h) { return h != null && String(h).length > 0; }).map(String);

        // Logging: show headers and clean list
        try {
            if (this.logger) {
                var logEnabled = this.logger.getEnabled();
                console.log("enabled? %s", logEnabled);
                this.logger.log('[CampaignToolsModel] preferredAddressColumnName: headers =', headers);
                this.logger.log('[CampaignToolsModel] preferredAddressColumnName: clean =', clean);
                this.logger.log('[CampaignToolsModel] preferredAddressColumnName: prefs.addressColumn =', [this.prefs.addressColumn]);
            }
        } catch (e) {}

        if (this.prefs.addressColumn && clean.indexOf(this.prefs.addressColumn) !== -1) {
            try { if (this.logger) { this.logger.log('[CampaignToolsModel] preferredAddressColumnName: returning prefs.addressColumn', [this.prefs.addressColumn]); } } catch (e) {}
            return this.prefs.addressColumn;
        }
        var match = null;
        for (var i = 0; i < clean.length; i++) {
            if (/address/i.test(clean[i])) {
                match = clean[i];
                break;
            }
        }
        if (match) {
            try { if (this.logger) { this.logger.log('[CampaignToolsModel] preferredAddressColumnName: returning match =', [match]); } } catch (e) {}
            return match;
        }

        try { if (this.logger) { this.logger.log('[CampaignToolsModel] preferredAddressColumnName: returning clean[0] =', [clean[0] || '']); } } catch (e) {}
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


// GAS-only static method for runtime       --  This should be part of the class.
(globalThis as any).CAMPAIGN.CampaignToolsModel.fromGAS = function(prefs: Preferences, spreadsheet?: any) {
    const effectivePrefs =
         prefs ||
         ((globalThis as any).CAMPAIGN &&
          (globalThis as any).CAMPAIGN.PreferenceSvc &&
          (globalThis as any).CAMPAIGN.PreferenceSvc.create().getPreferences());
    if (!effectivePrefs) {
        throw new Error("Preferences unavailable: must pass prefs or have PreferenceSvc loaded");
    }
    const sheetLayout = spreadsheet
        ? new (globalThis as any).CAMPAIGN.SheetLayout(spreadsheet)
        : new (globalThis as any).CAMPAIGN.SheetLayout();
    const layoutSummary: SheetLayoutSummary = sheetLayout.getLayoutSummary();
    // @ts-ignore
    return new CampaignToolsModel(layoutSummary, effectivePrefs);
};
