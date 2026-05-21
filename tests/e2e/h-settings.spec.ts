import { test, expect } from '@playwright/test'
import { goto, waitForLoad } from './helpers'

test.describe('H — Configurações e Sessão', () => {
  test('H1 — Alternar tema claro/escuro persiste no reload', async ({ page }) => {
    await goto(page, '/dashboard')

    // Clicar no toggle de tema
    const themeBtn = page.getByText(/modo claro|modo escuro/i).first()
    const labelBefore = await themeBtn.textContent()
    await themeBtn.click()
    await waitForLoad(page, 500)

    // Label inverteu
    const labelAfter = await page.getByText(/modo claro|modo escuro/i).first().textContent()
    expect(labelAfter).not.toBe(labelBefore)

    // Recarregar e verificar que manteve
    await page.reload()
    await waitForLoad(page)
    const labelReloaded = await page.getByText(/modo claro|modo escuro/i).first().textContent()
    expect(labelReloaded).toBe(labelAfter)

    // Restaurar tema original
    await page.getByText(/modo claro|modo escuro/i).first().click()
  })

  test('H2 — Logout e login restaura os dados do Supabase', async ({ page }) => {
    // Vai ao dashboard e captura o total da semana
    await goto(page, '/dashboard')
    const totalBefore = await page.getByText(/R\$\s*[\d.,]+/).first().textContent()

    // Logout
    await page.getByText('Sair').click()
    await page.waitForURL('**/', { timeout: 10_000 })
    await expect(page.getByText(/entrar|criar conta/i).first()).toBeVisible()

    // Login novamente
    await page.fill('input[type="email"]', process.env.TEST_EMAIL!)
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 20_000 })
    await waitForLoad(page, 2500)

    // Dados restaurados
    const totalAfter = await page.getByText(/R\$\s*[\d.,]+/).first().textContent()
    expect(totalAfter).toBe(totalBefore)
  })
})
