// src/PreferenceSvc.ts

export class PreferenceSvc {
  constructor(
    private readonly scriptProps = PropertiesService.getScriptProperties()
  ) {}

  getMapsApiKey(): string | null {
    return this.scriptProps.getProperty("GOOGLE_MAPS_API_KEY");
  }
}

