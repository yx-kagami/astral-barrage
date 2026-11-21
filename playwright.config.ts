import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://127.0.0.1:4173/astral-barrage/'
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

export default defineConfig({
  testDir: './tests/browser',
  timeout: 60_000,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } },
    ...(process.env.PLAYWRIGHT_WEBKIT ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }] : []),
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort --base /astral-barrage/',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
