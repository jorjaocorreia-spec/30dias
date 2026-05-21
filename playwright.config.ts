import { defineConfig } from '@playwright/test'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'on-failure' }], ['list']],
  timeout: 40_000,
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'https://jorge-7dias.27pl2o.easypanel.host',
    headless: false,
    viewport: { width: 1280, height: 800 },
    storageState: 'tests/e2e/.auth/user.json',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
    actionTimeout: 15_000,
  },
})
