// code/gas/src/logic/IntegrationTest.ts
import { PreferenceSvc } from "./PreferenceSvc";

// Re-export so webpack's library assign puts it on globalThis.CAMPAIGN_TOOLS
export { PreferenceSvc } from "./PreferenceSvc";

// Keep a trivial callable too (handy for quick checks)
export function runIntegrationTest(): string {
    return "INTEGRATION SUCCESS";
}

// (Optional belt-and-suspenders: also attach manually; harmless if left in.)
(globalThis as any).CAMPAIGN_TOOLS = (globalThis as any).CAMPAIGN_TOOLS || {};
(globalThis as any).CAMPAIGN_TOOLS.PreferenceSvc = PreferenceSvc;
