const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  workers: 1,
  retries: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run serve',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
