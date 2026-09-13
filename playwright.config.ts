import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: 2,
  use: { baseURL: process.env.TEST_URL || 'http://127.0.0.1:4321', headless: true },
  webServer: {
    env: { ASTRO_PREVIEW_BACKGROUND: '1', ASTRO_TELEMETRY_DISABLED: '1' },
    command: 'npm run preview -- --port 4321',
    url: process.env.TEST_URL || 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
  },
});
