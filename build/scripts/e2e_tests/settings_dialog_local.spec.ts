import { test, expect } from '@playwright/test';

const localFile = 'file:///home/chris/grassroots_campaign_tools/dist/ui/rendered_settings_dialog_test.html';

test.describe('Settings Dialog Local Render', () => {
  test('should render expected controls', async ({ page }) => {
    await page.goto(localFile);
    // Wait for the Maps API Key input (by id)
    await expect(page.locator('#mapsApiKey')).toBeVisible();
    // Show API Key checkbox
    await expect(page.locator('#showApiKey')).toBeVisible();
    // Sheet Tab select
    await expect(page.locator('#sheetSelect')).toBeVisible();
    // Address Column select
    await expect(page.locator('#addressSelect')).toBeVisible();
    // Show Lat/Lng columns checkbox
    await expect(page.locator('#showLatLng')).toBeVisible();
    // Debug Logging checkbox
    await expect(page.locator('#debug')).toBeVisible();
    // Save button
    await expect(page.locator('#saveBtn')).toBeVisible();
  });
});
