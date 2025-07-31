export interface FormState {
  mapsApiKey: string;
  selectedSheet: string;
  headers: string[];
}

export function isFormValid(state: FormState): boolean {
  const hasApiKey = state.mapsApiKey.trim() !== "";
  const hasHeaders = state.headers && state.headers.length > 0;
  const hasSheet = state.selectedSheet.trim() !== "";
  return hasApiKey && hasSheet && hasHeaders;
}

