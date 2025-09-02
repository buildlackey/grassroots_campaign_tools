// code/common/src/IntegrationTest.ts
import { PreferenceSvc } from "./PreferenceSvc";
import { CampaignToolsModel } from "./CampaignToolsModel";

// Re-export so consumers can grab directly
export { PreferenceSvc } from "./PreferenceSvc";
export { CampaignToolsModel } from "./CampaignToolsModel";

export function runIntegrationTest(): string {
    const g: any = globalThis;

    const prefs = g.CAMPAIGN_TOOLS.PreferenceSvc.create().getPreferences();

    const model = new g.CampaignToolsModel({
        sheetTabNames: ["Sheet1", "Sheet2"],
        sheetTabToColumnNames: {
            Sheet1: ["Address"],
            Sheet2: ["OtherCol"],
        },
        prefs,
    });

    const preferred = model.preferredSheetTabName;

    if (preferred !== "Sheet1") {
        throw new Error(`Integration test failed: expected preferredSheetTabName="Sheet1", got "${preferred}"`);
    }

    return "INTEGRATION SUCCESS";
}

// Belt-and-suspenders: attach manually too
(globalThis as any).CAMPAIGN_TOOLS = (globalThis as any).CAMPAIGN_TOOLS || {};
(globalThis as any).CAMPAIGN_TOOLS.PreferenceSvc = PreferenceSvc;
(globalThis as any).CAMPAIGN_TOOLS.CampaignToolsModel = CampaignToolsModel;
