// code/common/src/PreferenceSvc.d.ts
// Ambient declaration so Preferences is globally available in GAS + TS

interface Preferences {
    sheetTabName: string;
    addressColumn: string;
    mapsApiKey: string;
    showLatLong: boolean;
    debug: boolean;
}
