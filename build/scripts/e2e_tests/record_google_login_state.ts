import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Read SHEET_URL from environment (set by your launcher or manually)
const SHEET_URL = process.env.SHEET_URL;
if (!SHEET_URL) {
    console.error('❌ SHEET_URL is not set. Please source your maps_env.conf before running this script.');
    process.exit(1);
}
// Where to save the login state
const STORAGE_PATH = path.resolve(process.env.HOME || '~', '.playwright/grassroots_campaign_tools/storageState.json');

// Ensure the directory exists
fs.mkdirSync(path.dirname(STORAGE_PATH), { recursive: true });

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log('Navigate to the Google login page and authenticate.');
    await page.goto(SHEET_URL);
    console.log('Please complete Google login in the browser window.');
    await page.waitForTimeout(60000); // Give user 60s to log in
    await context.storageState({ path: STORAGE_PATH });
    console.log(`Storage state saved to ${STORAGE_PATH}`);
    await browser.close();
})();
