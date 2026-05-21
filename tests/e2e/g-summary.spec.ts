import { test, expect } from '@playwright/test'
import { TAG, goto, waitForLoad } from './helpers'

test.describe('G — Resumo Semanal', () => {
  test('G1 — Página carrega com total e gráfico de evolução', async ({ page }) => {
    await goto(page, '/summary')
    await expect(page.getByText('Total gasto')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Evolução diária')).toBeVisible({ timeout: 8_000 })
  })

  test('G2 — Breakdown por categoria aparece após criar despesa', async ({ page }) => {
    // Cria uma despesa de teste para garantir dados na semana atual
    await goto(page, '/expenses/new')
    await page.fill('input[type="number"]', '10')
    // Seleciona primeira categoria disponível
    await page.locator('.grid button').first().click()
    await page.fill('input[placeholder="Ex: Almoço no restaurante"]', `${TAG} G2 despesa`)
    await page.getByRole('button', { name: 'Adicionar despesa' }).click()
    await waitForLoad(page)

    // Agora verifica breakdown no resumo
    await goto(page, '/summary')
    await expect(page.getByText('Por categoria')).toBeVisible({ timeout: 10_000 })

    // Limpa: exclui a despesa criada
    await goto(page, '/expenses')
    await waitForLoad(page)
    const row = page.locator('div').filter({ hasText: `${TAG} G2 despesa` }).first()
    const deleteBtn = row.locator('button[aria-label*="xclu"], button').last()
    await deleteBtn.click().catch(() => {}) // ignora se não tiver botão inline
  })

  test('G3 — Navegar semanas: anterior e voltar via botão Atual', async ({ page }) => {
    await goto(page, '/summary')

    // Captura label da semana atual (está no header do Resumo)
    const labelEl = page.locator('.app-main p.text-xs').first()
    const labelCurrent = await labelEl.textContent()

    // Navegar para semana anterior — escopar ao .app-main para não clicar na sidebar
    const main = page.locator('.app-main')
    await main.getByRole('button').filter({ has: page.locator('svg') }).first().click()
    await waitForLoad(page)

    // Label deve ter mudado
    const labelPrev = await labelEl.textContent()
    expect(labelPrev).not.toBe(labelCurrent)

    // Voltar para semana atual via botão "Atual"
    await page.getByRole('button', { name: 'Atual' }).click()
    await waitForLoad(page)

    // Label volta ao original
    const labelBack = await labelEl.textContent()
    expect(labelBack).toBe(labelCurrent)
  })
})
