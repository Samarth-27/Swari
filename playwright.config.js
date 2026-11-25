import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 45000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: process.env.SWARI_BASE_URL || 'http://localhost:8000',
    trace: 'on-first-retry',
    headless: true
  },
  webServer: {
    command: 'node server/index.js',
    url: 'http://localhost:8000/health',
    reuseExistingServer: true,
    timeout: 30000
  }
});
