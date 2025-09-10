/// <reference path="../../common/src/PreferenceSvc.d.ts" />

declare function getSheetTabsAndColumnNames(): {
  sheetTabNames: string[];
  sheetTabToColumnNames: Record<string, string[]>;
};

interface CampaignToolsModelState {
  sheetTabNames: string[];
  sheetTabToColumnNames: Record<string, string[]>;
  prefs: Preferences;
  preferredSheetTabName?: string;
  preferredAddressColumnName?: string;
}
