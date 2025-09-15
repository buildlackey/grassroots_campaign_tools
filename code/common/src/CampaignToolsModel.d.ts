
import type { Preferences } from 'PreferenceSvc';

export interface CampaignToolsModelState {
  sheetTabNames: string[];
  sheetTabToColumnNames: Record<string, string[]>;
  prefs: Preferences;
  preferredSheetTabName?: string;
  preferredAddressColumnName?: string;
}
