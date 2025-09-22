import {Preferences} from "../../../common/src/PreferenceSvc";

class PreferenceSvc {
    static DOC_KEYS = {
        SHEET_TAB_NAME: 'prefs.sheetTabName',
        ADDRESS_COL: 'prefs.addressColumn',
        SHOW_LATLNG: 'prefs.showLatLong',
        DEBUG: 'prefs.debug',
        ADDRESS_COL_OFFSET: 'prefs._addressColumnOffset',
    } as const;

    static USER_KEYS = {
        MAPS_KEY: 'prefs.mapsApiKey',
        DEBUG: 'prefs.debug',
    } as const;

    public logger: any;

    constructor(
        private docProps: GoogleAppsScript.Properties.Properties,
        private userProps: GoogleAppsScript.Properties.Properties
    ) {
        // logger will be set in static create
    }

    static toBool(v: any, fallback: boolean): boolean {
        if (v == null) return !!fallback;
        const s = String(v).trim().toLowerCase();
        return s === 'true';
    }

    static fromBool(b: boolean): string {
        return b ? 'true' : 'false';
    }

    getPreferences(): Preferences {
        const d = this.docProps.getProperties();
        const u = this.userProps.getProperties();
        return {
            sheetTabName: d[PreferenceSvc.DOC_KEYS.SHEET_TAB_NAME] || '',
            addressColumn: d[PreferenceSvc.DOC_KEYS.ADDRESS_COL] || '',
            mapsApiKey: u[PreferenceSvc.USER_KEYS.MAPS_KEY] || '',
            showLatLong: PreferenceSvc.toBool(d[PreferenceSvc.DOC_KEYS.SHOW_LATLNG], false),
            debug: PreferenceSvc.toBool(u[PreferenceSvc.USER_KEYS.DEBUG], false),
        };
    }

    savePreferences(prefs: Partial<Preferences>, columnNames: string[]): Preferences {
        this.logger.log("📥 [PreferenceSvc.savePreferences] called with prefs=%s, columns=%s",
            JSON.stringify(prefs), JSON.stringify(columnNames));

        const current = this.getPreferences();
        this.logger.log("🔎 Current prefs: %s", JSON.stringify(current));

        const updatedPrefs: Preferences = {
            sheetTabName: prefs.sheetTabName ?? current.sheetTabName,
            addressColumn: prefs.addressColumn ?? current.addressColumn,
            mapsApiKey: prefs.mapsApiKey ?? current.mapsApiKey,
            showLatLong: typeof prefs.showLatLong === 'boolean' ? prefs.showLatLong : current.showLatLong,
            debug: typeof prefs.debug === 'boolean' ? prefs.debug : current.debug,
        };

        this.logger.log("➡️  Computed updatedPrefs prefs: %s", JSON.stringify(updatedPrefs));

        const callHasOnlyKey =
            !!prefs.mapsApiKey &&
            !prefs.sheetTabName &&
            !prefs.addressColumn &&
            typeof prefs.showLatLong === 'undefined' &&
            typeof prefs.debug === 'undefined' &&
            (!Array.isArray(columnNames) || columnNames.length === 0);

        const callHasFullSet =
            !!prefs.mapsApiKey &&
            !!prefs.sheetTabName &&
            !!prefs.addressColumn &&
            typeof prefs.showLatLong === 'boolean' &&
            typeof prefs.debug === 'boolean' &&
            Array.isArray(columnNames) &&
            columnNames.length > 0;

        this.logger.log("🧾 Call type: onlyKey=%s fullSet=%s", callHasOnlyKey, callHasFullSet);

        if (!(callHasOnlyKey || callHasFullSet)) {
            this.logger.log("❌ Invalid prefs detected");
            throw new Error(
                'Invalid preferences: provide either only {mapsApiKey}, or provide {mapsApiKey, sheetTabName, addressColumn, showLatLong, debug} plus columnNames[].'
            );
        }

        if (prefs.mapsApiKey !== undefined) {
            this.logger.log("💾 Storing user property: mapsApiKey");
            this.userProps.setProperty(PreferenceSvc.USER_KEYS.MAPS_KEY, updatedPrefs.mapsApiKey);
        }
        if (prefs.debug !== undefined) {
            this.logger.log("💾 Storing user property: debug=%s", updatedPrefs.debug);
            this.userProps.setProperty(PreferenceSvc.USER_KEYS.DEBUG, PreferenceSvc.fromBool(!!prefs.debug));
        }

        if (callHasFullSet) {
            const idx = columnNames.indexOf(updatedPrefs.addressColumn);
            if (idx === -1) throw new Error('addressColumn must be one of columnNames.');

            this.logger.log("💾 Storing doc properties: sheetTab=%s addrCol=%s showLatLong=%s colOffset=%s dbg=%s",
                updatedPrefs.sheetTabName, updatedPrefs.addressColumn, updatedPrefs.showLatLong, updatedPrefs.debug, idx);

            if (prefs.sheetTabName !== undefined) {
                this.docProps.setProperty(PreferenceSvc.DOC_KEYS.SHEET_TAB_NAME, updatedPrefs.sheetTabName);
            }
            if (prefs.addressColumn !== undefined) {
                this.docProps.setProperty(PreferenceSvc.DOC_KEYS.ADDRESS_COL, updatedPrefs.addressColumn);
            }
            if (prefs.showLatLong !== undefined) {
                this.docProps.setProperty(PreferenceSvc.DOC_KEYS.SHOW_LATLNG, PreferenceSvc.fromBool(!!updatedPrefs.showLatLong));
            }
            if (prefs.debug !== undefined) {
                this.docProps.setProperty(PreferenceSvc.DOC_KEYS.DEBUG, PreferenceSvc.fromBool(!!updatedPrefs.debug));
            }

            this.docProps.setProperty(PreferenceSvc.DOC_KEYS.ADDRESS_COL_OFFSET, String(idx));
        }

        const finalPrefs = this.getPreferences();
        this.logger.log("✅ Final prefs saved: %s", JSON.stringify(finalPrefs));

        // Update CampaignToolsLogger singleton in GAS environment
        if ((globalThis as any).CAMPAIGN && (globalThis as any).CAMPAIGN.CampaignToolsLogger) {
            (globalThis as any).CAMPAIGN.CampaignToolsLogger.getInstance().setEnabled(!!finalPrefs.debug);
        }

        return finalPrefs;
    }

    clearPreferences(opts: { document?: boolean; user?: boolean } = {}): void {
        const clearDoc = opts.document === undefined ? true : !!opts.document;
        const clearUser = !!opts.user;

        if (clearDoc) {
            this.docProps.deleteProperty(PreferenceSvc.DOC_KEYS.SHEET_TAB_NAME);
            this.docProps.deleteProperty(PreferenceSvc.DOC_KEYS.ADDRESS_COL);
            this.docProps.deleteProperty(PreferenceSvc.DOC_KEYS.SHOW_LATLNG);
            this.docProps.deleteProperty(PreferenceSvc.DOC_KEYS.ADDRESS_COL_OFFSET);
        }
        if (clearUser) {
            this.userProps.deleteProperty(PreferenceSvc.USER_KEYS.MAPS_KEY);
            this.userProps.deleteProperty(PreferenceSvc.USER_KEYS.DEBUG);
        }
    }

    /** Factory for production GAS runtime */
    static create(): PreferenceSvc {
        // Ensure CampaignToolsLogger is attached to globalThis.CAMPAIGN before using it
        if (!(globalThis as any).CAMPAIGN || !(globalThis as any).CAMPAIGN.CampaignToolsLogger) {
            throw new Error("CampaignToolsLogger is not loaded. Make sure it is attached to globalThis.CAMPAIGN before PreferenceSvc is loaded.");
        }
        var svc = new PreferenceSvc(
            PropertiesService.getDocumentProperties(),
            PropertiesService.getUserProperties()
        );
        svc.logger = (globalThis as any).CAMPAIGN.CampaignToolsLogger.getInstance();
        return svc;
    }
}

console.log("PreferenceSvc loaded and attached to globalThis.CAMPAIGN");
// === Namespace exposure only (no global function shims) ===
(globalThis as any).CAMPAIGN = (globalThis as any).CAMPAIGN || {};
(globalThis as any).CAMPAIGN.PreferenceSvc = PreferenceSvc;
