import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.URAI_CONTENT_BASE_URL ?? 'http://127.0.0.1:3000';

const visualProduction = process.env.URAI_CONTENT_VISUAL_PRODUCTION === '1';
const exactHead = process.env.EXACT_HEAD ?? '';
if (visualProduction && !/^[0-9a-f]{40}$/.test(exactHead)) {
  throw new Error('Retained Content visual proof requires a complete exact-head identity.');
}
if (visualProduction && (process.env.PLAYWRIGHT_SKIP_WEB_SERVER || baseURL !== 'http://127.0.0.1:3000')) {
  throw new Error('Retained Content visual proof must start its own local production-built server.');
}

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'chromium-narrow-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 }
      }
    },
    {
      name: 'chromium-tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 834, height: 1194 },
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
      }
    }
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: visualProduction ? 'npm run start -- --hostname 127.0.0.1 --port 3000' : 'npm run dev',
        env: visualProduction ? { GITHUB_SHA: exactHead, URAI_CONTENT_BUILD_SHA: exactHead } : undefined,
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI && !visualProduction,
        timeout: 120_000
      }
});
