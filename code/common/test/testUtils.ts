import * as fs from "fs";
import * as path from "path";

/**
 * Shared logging flag configuration for tests
 */
export function getLoggingFlag(): boolean {
    try {
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (homeDir) {
            const configPath = path.resolve(homeDir, ".campaign", "test-config.json");
            if (fs.existsSync(configPath)) {
                const raw = fs.readFileSync(configPath, "utf8");
                if (raw.trim()) {
                    const config = JSON.parse(raw);
                    if (typeof config.CAMPAIGN_TOOLS_ENABLE_LOGGING !== "undefined") {
                        return !!config.CAMPAIGN_TOOLS_ENABLE_LOGGING;
                    }
                }
            }
        }
    } catch (e) {
        // Optionally log error for debugging
    }
    return false;
}

// Optionally export LOGGING_ENABLED for convenience
export const LOGGING_ENABLED = getLoggingFlag();
