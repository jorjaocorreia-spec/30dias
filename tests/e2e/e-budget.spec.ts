import { test, expect } from '@playwright/test'
import { TAG, goto, waitForLoad, expectVisible } from './helpers'

test.describe('E — Dashboard: orçamento e cálculos', () => {
  test('E1 — Barra de orçamento mostra percentual válido (0–100%)', async ({ page }) => {
    await goto(page, '/dashboard')

    const percentText = page.getByText(/%/).first()
    await expect(percentText).toBeVisible({ timeout: 8_000 })

    const text = await percentText.textContent()
    const percent = parseFloat(text?.replace('%', '') ?? '-1')
    expect(percent).toBeGreaterThanOrEqual(0)
    expect(percent).toBeLessThanOrEqual(100)
  })

  test('E2 — Card Saldo do Mês está visível no dashboard', async ({ page }) => {
    await goto(page, '/dashboard')
    await expect(page.getByText(/Saldo do Mês|saldo/i).first()).toBeVisible({ timeout: 8_000 })
    // Verifica que há um valor monetário no card
    await expect(page.getByText(/R\$\s*[\d.,]+/).first()).toBeVisible({ timeout: 6_000 })
  })

  test('E3 — Despesa criada hoje aparece no painel do dia no dashboard', async ({ page }) => {
    // Cria despesa de hoje
    await goto(page, '/expenses/new')
    await page.fill('input[type="number"]', '25')
    await page.locator('.grid button').first().click()
    await page.fill('input[placeholder="Ex: Almoço no restaurante"]', `${TAG} Dashboard dia`)
    await page.getByRole('button', { name: 'Adicionar despesa' }).click()
    await waitForLoad(page)

    // Verifica no dashboard (painel do dia = hoje por padrão)
    await goto(page, '/dashboard')
    await expectVisible(page, `${TAG} Dashboard dia`)

    // Limpa — escopa o botão Excluir à linha correta
    await goto(page, '/expenses')
    await waitForLoad(page)
    const row = page.locator('.space-y-2 > div').filter({ hasText: `${TAG} Dashboard dia` }).first()
    if (await row.isVisible()) {
      await row.getByRole('button', { name: 'Excluir' }).click()
      await waitForLoad(page, 300)
      await row.getByRole('button', { name: 'Excluir' }).click()
      await waitForLoad(page)
    }
  })

  test('E4 — Navegar semanas no dashboard atualiza os dados', async ({ page }) => {
    await goto(page, '/dashboard')

    // Captura label da semana atual
    const weekLabel = page.locator('.app-main p.text-xs').first()
    const current = await weekLabel.textContent()

    // Vai para semana anterior (ChevronLeft no app-main)
    await page.locator('.app-main').getByRole('button').filter({ has: page.locator('svg') }).first().click()
    await waitForLoad(page)

    const prev = await weekLabel.textContent()
    expect(prev).not.toBe(current)

    // Volta para semana atual
    await page.getByRole('button', { name: /Hoje/i }).click()
    await waitForLoad(page)

    const back = await weekLabel.textContent()
    expect(back).toBe(current)
  })
})
