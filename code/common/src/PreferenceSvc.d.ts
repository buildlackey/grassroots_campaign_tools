export interface Preferences {
    sheetTabName: string;
    addressColumn: string;
    mapsApiKey: string;
    showLatLong: boolean;
    debug: boolean;
}
export declare class PreferenceSvc {
    private docProps;
    private userProps;
    private static DOC_KEYS;
    private static USER_KEYS;
    constructor(docProps: GoogleAppsScript.Properties.Properties, userProps: GoogleAppsScript.Properties.Properties);
    private static toBool;
    private static fromBool;
    getPreferences(): Preferences;
    savePreferences(prefs: Partial<Preferences>, columnNames: string[]): Preferences;
    clearPreferences(opts?: {
        document?: boolean;
        user?: boolean;
    }): void;
    /** Factory for production GAS runtime */
    static create(): PreferenceSvc;
}
