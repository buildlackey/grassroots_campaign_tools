// code/gas/src/raw/PreferenceService.ts
export interface Preferences {
  sheetTabName: string;
  addressColumn: string;
  mapsApiKey: string;
  showLatLong: boolean;
  debug: boolean;
}

export class PreferenceSvc {
  private static DOC_KEYS = {
    SHEET_TAB_NAME: 'prefs.sheetTabName',
    ADDRESS_COL: 'prefs.addressColumn',
    SHOW_LATLNG: 'prefs.showLatLong',
    ADDRESS_COL_OFFSET: 'prefs._addressColumnOffset',
  } as const;

  private static USER_KEYS = {
    MAPS_KEY: 'prefs.mapsApiKey',
    DEBUG: 'prefs.debug',
  } as const;

  constructor(
    private docProps: GoogleAppsScript.Properties.Properties,
    private userProps: GoogleAppsScript.Properties.Properties
  ) {}

  private static toBool(v: any, fallback: boolean): boolean {
    if (v == null) return !!fallback;
    const s = String(v).trim().toLowerCase();
    return s === 'true';
  }
  private static fromBool(b: boolean): string {
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
    const current = this.getPreferences();

    const next: Preferences = {
      sheetTabName: prefs.sheetTabName ?? current.sheetTabName,
      addressColumn: prefs.addressColumn ?? current.addressColumn,
      mapsApiKey: prefs.mapsApiKey ?? current.mapsApiKey,
      showLatLong: typeof prefs.showLatLong === 'boolean' ? prefs.showLatLong : current.showLatLong,
      debug: typeof prefs.debug === 'boolean' ? prefs.debug : current.debug,
    };

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

    if (!(callHasOnlyKey || callHasFullSet)) {
      throw new Error(
        'Invalid preferences: provide either only {mapsApiKey}, or provide {mapsApiKey, sheetTabName, addressColumn, showLatLong, debug} plus columnNames[].'
      );
    }

    // Persist user fields if present in the call
    if (prefs.mapsApiKey !== undefined) {
      this.userProps.setProperty(PreferenceSvc.USER_KEYS.MAPS_KEY, next.mapsApiKey);
    }
    if (prefs.debug !== undefined) {
      this.userProps.setProperty(PreferenceSvc.USER_KEYS.DEBUG, PreferenceSvc.fromBool(!!prefs.debug));
    }

    // Full set → persist doc primaries + derived
    if (callHasFullSet) {
      const idx = columnNames.indexOf(next.addressColumn);
      if (idx === -1) throw new Error('addressColumn must be one of columnNames.');

      if (prefs.sheetTabName !== undefined) {
        this.docProps.setProperty(PreferenceSvc.DOC_KEYS.SHEET_TAB_NAME, next.sheetTabName);
      }
      if (prefs.addressColumn !== undefined) {
        this.docProps.setProperty(PreferenceSvc.DOC_KEYS.ADDRESS_COL, next.addressColumn);
      }
      if (prefs.showLatLong !== undefined) {
        this.docProps.setProperty(PreferenceSvc.DOC_KEYS.SHOW_LATLNG, PreferenceSvc.fromBool(!!next.showLatLong));
      }

      this.docProps.setProperty(PreferenceSvc.DOC_KEYS.ADDRESS_COL_OFFSET, String(idx));
    }

    return this.getPreferences();
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
  static forGAS(): PreferenceSvc {
    return new PreferenceSvc(
      PropertiesService.getDocumentProperties(),
      PropertiesService.getUserProperties()
    );
  }
}

// GAS entry shims (optional; only if you deploy TS→JS to GAS directly)
(globalThis as any).getPreferences = () => PreferenceSvc.forGAS().getPreferences();
(globalThis as any).savePreferences = (prefs: Preferences, cols: string[]) =>
  PreferenceSvc.forGAS().savePreferences(prefs, cols);
(globalThis as any).clearPreferences = (opts: { document?: boolean; user?: boolean }) =>
  PreferenceSvc.forGAS().clearPreferences(opts);

