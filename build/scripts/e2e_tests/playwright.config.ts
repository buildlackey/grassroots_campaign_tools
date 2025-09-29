import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  testDir: __dirname,
  outputDir: path.resolve(__dirname, '../../../dist/e2e_tests'),
  timeout: 30000,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.resolve(__dirname, '../../../dist/e2e_tests_html_report') }],
  ],
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    // No storageState for local file tests
  },
});
