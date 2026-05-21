import { test, expect } from '@playwright/test'
import { TAG, goto, waitForLoad, expectVisible, expectGone } from './helpers'

const SOURCE_DESC = `${TAG} Salário`
const ENTRY_DESC  = `${TAG} Freela avulso`

test.describe.serial('D — Receitas: CRUD completo', () => {
  test('D1 — Criar fonte recorrente aparece na lista', async ({ page }) => {
    await goto(page, '/income')

    // Botão "+ Fonte" no header
    await page.getByText('+ Fonte').click()
    await waitForLoad(page, 600)
    await expect(page.getByText('Nova fonte recorrente')).toBeVisible({ timeout: 6_000 })

    // Descrição
    await page.locator('input[placeholder*="Salário, Aluguel"]').fill(SOURCE_DESC)

    // Valor esperado
    await page.locator('input[type="number"]').fill('3000')

    // Categoria: select (não botões)
    const catSelect = page.locator('select').first()
    const opts = await catSelect.locator('option').all()
    if (opts.length > 1) await catSelect.selectOption(await opts[1].getAttribute('value') ?? '')

    await page.getByRole('button', { name: /Criar fonte|Salvar/i }).click()
    await waitForLoad(page)

    await expectVisible(page, SOURCE_DESC)
  })

  test('D2 — Registrar entrada mensal da fonte', async ({ page }) => {
    await goto(page, '/income')

    // Clicar "Registrar" na seção de fontes pendentes
    const sourceRow = page.locator('div').filter({ hasText: SOURCE_DESC }).first()
    await sourceRow.getByRole('button', { name: 'Registrar' }).click()
    await waitForLoad(page, 500)

    // Modal de registro rápido
    const amountInput = page.locator('input[type="number"]').last()
    await amountInput.clear()
    await amountInput.fill('3000')

    await page.getByRole('button', { name: 'Confirmar' }).click()
    await waitForLoad(page, 1500)

    await expectVisible(page, 'R$ 3.000,00')
  })

  test('D3 — Receita avulsa (sem fonte) aparece na lista', async ({ page }) => {
    await goto(page, '/income')

    // Botão "Avulsa" (+ Avulsa)
    await page.getByRole('button', { name: /Avulsa/i }).click()
    await waitForLoad(page, 500)
    await expect(page.getByText('Nova receita')).toBeVisible({ timeout: 6_000 })

    // Valor
    await page.locator('input[type="number"]').last().fill('500')

    // Descrição
    await page.locator('input[placeholder*="Salário, Freela"]').fill(ENTRY_DESC)

    // Categoria: botões dentro do modal (escopa para evitar interceptação por overlay)
    const modal = page.locator('.fixed.z-50.overflow-y-auto')
    await modal.getByRole('button').filter({ hasText: 'Freelance' }).click()

    await page.getByRole('button', { name: 'Registrar' }).click()
    await waitForLoad(page, 1500)

    await expectVisible(page, ENTRY_DESC)
    await expectVisible(page, 'R$ 500,00')
  })

  test('D4 — Excluir fonte remove entradas vinculadas (cascata)', async ({ page }) => {
    await goto(page, '/income')

    // Encontra o card da fonte (tem "Esperado:" — único nas fontes, não nas entradas)
    const sourceCard = page.locator('.space-y-2 > div')
      .filter({ hasText: SOURCE_DESC })
      .filter({ hasText: 'Esperado:' })
      .first()
    await sourceCard.getByRole('button', { name: 'Excluir' }).click()
    await waitForLoad(page, 300)

    // Confirmação inline
    await sourceCard.getByRole('button', { name: 'Excluir' }).click()
    await waitForLoad(page, 1500)

    await expectGone(page, SOURCE_DESC)

    // Limpa a receita avulsa criada em D3 (botão de lixeira, sem texto)
    const avulsaCard = page.locator('.space-y-2 > div').filter({ hasText: ENTRY_DESC }).first()
    if (await avulsaCard.isVisible()) {
      await avulsaCard.locator('button').last().click()
      await waitForLoad(page)
    }
  })
})
