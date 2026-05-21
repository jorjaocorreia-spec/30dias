import { chromium } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = process.env.TEST_BASE_URL || 'https://jorge-7dias.27pl2o.easypanel.host'
const AUTH_FILE = path.join(__dirname, '.auth/user.json')

export default async function globalSetup() {
  if (!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD) {
    throw new Error('TEST_EMAIL e TEST_PASSWORD devem estar definidos em .env.test')
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log('\n🔐 Fazendo login para testes...')
  await page.goto(BASE_URL)
  await page.waitForSelector('input[type="email"]', { timeout: 15_000 })

  await page.fill('input[type="email"]', process.env.TEST_EMAIL)
  await page.fill('input[type="password"]', process.env.TEST_PASSWORD)
  await page.click('button[type="submit"]')

  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 20_000 })
  // Aguarda dados carregarem do Supabase
  await page.waitForTimeout(2500)

  await context.storageState({ path: AUTH_FILE })
  await browser.close()
  console.log('✓ Login concluído — sessão salva\n')
}
