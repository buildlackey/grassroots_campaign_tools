/// <reference path="../../common/src/PreferenceSvc.d.ts" />

declare function getSheetTabsAndColumnNames(): {
  sheetTabNames: string[];
  sheetTabToColumnNames: Record<string, string[]>;
};

export interface CampaignInitData {
  sheetTabNames: string[];
  sheetTabToColumnNames: Record<string, string[]>;
  prefs: Preferences;
  preferredSheetTabName?: string;
  preferredAddressColumnName?: string;
}
