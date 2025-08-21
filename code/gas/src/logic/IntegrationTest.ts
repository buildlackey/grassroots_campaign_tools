// code/gas/src/logic/IntegrationTest.ts
// Ideally this would live in test folder.  but keep here for now
import { PreferenceSvc } from "./PreferenceSvc";

/**
 * Performs a round-trip test:
 *   - writes a dummy Maps API key into PreferenceSvc (userProps)
 *   - reads it back out
 *   - verifies equality
 *
 * If successful → returns "INTEGRATION SUCCESS"
 * If failure → throws Error (will propagate in GAS execution log)
 */
export function runIntegrationTest(): string {
    const svc = PreferenceSvc.forGAS();

    const dummyKey = "TEST_KEY_123";

    // clear old state
    svc.clearPreferences({ document: false, user: true });

    // save only the mapsApiKey (valid "onlyKey" call)
    svc.savePreferences({ mapsApiKey: dummyKey }, []);

    const prefs = svc.getPreferences();

    if (prefs.mapsApiKey !== dummyKey) {
        throw new Error(`Integration test failed: expected "${dummyKey}", got "${prefs.mapsApiKey}"`);
    }

    return "INTEGRATION SUCCESS";
}

// Expose to GAS runtime
(globalThis as any).runIntegrationTest = () => runIntegrationTest();
