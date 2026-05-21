import { Page, expect } from '@playwright/test'

// Tag única por execução para identificar e limpar dados de teste
export const TAG = `[e2e-${Date.now()}]`

/** Aguarda a página carregar dados do Supabase */
export async function waitForLoad(page: Page, ms = 1500) {
  await page.waitForTimeout(ms)
}

/** Navega e aguarda carregamento */
export async function goto(page: Page, path: string) {
  await page.goto(path)
  await waitForLoad(page)
}

/** Verifica que o texto aparece na página */
export async function expectVisible(page: Page, text: string) {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 10_000 })
}

/** Verifica que o texto NÃO aparece na página */
export async function expectGone(page: Page, text: string) {
  await expect(page.getByText(text, { exact: false }).first()).not.toBeVisible({ timeout: 8_000 })
}
