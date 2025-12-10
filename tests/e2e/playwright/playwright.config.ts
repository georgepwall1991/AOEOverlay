import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for cross-browser E2E testing
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory relative to this config file
  testDir: './specs',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI for stability
  workers: process.env.CI ? 1 : undefined,

  // Test timeout
  timeout: 30000,

  // Reporter configuration
  reporter: [
    // HTML reporter for local review
    ['html', { outputFolder: 'playwright-report' }],
    // JSON reporter for CI processing
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    // GitHub Actions reporter when running in CI
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  // Shared settings for all tests
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:1420',

    // Capture screenshot only on failure
    screenshot: 'only-on-failure',

    // Retain video only on failure
    video: 'retain-on-failure',

    // Collect trace on first retry
    trace: 'on-first-retry',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Run local dev server before starting the tests
  webServer: {
    command: 'VITE_MOCK_TAURI=true npm run dev -- --port 1420',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_MOCK_TAURI: 'true',
    },
  },
});
