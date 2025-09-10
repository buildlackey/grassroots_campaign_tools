/// <reference path="../../common/src/PreferenceSvc.d.ts" />


interface CampaignToolsModelState {
  sheetTabNames: string[];
  sheetTabToColumnNames: Record<string, string[]>;
  prefs: Preferences;
  preferredSheetTabName?: string;
  preferredAddressColumnName?: string;
}
