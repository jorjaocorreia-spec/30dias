import { test, expect } from '@playwright/test'
import { TAG, goto, waitForLoad, expectVisible, expectGone } from './helpers'

const DESC = `${TAG} Almoço teste`
const DESC_EDIT = `${TAG} Almoço editado`

test.describe.serial('B — Despesas: CRUD completo', () => {
  test('B1 — Criar despesa aparece na lista com valor correto', async ({ page }) => {
    await goto(page, '/expenses/new')

    await page.fill('input[type="number"]', '47.50')
    await page.locator('.grid button').first().click()
    await page.fill('input[placeholder="Ex: Almoço no restaurante"]', DESC)
    await page.getByRole('button', { name: 'Adicionar despesa' }).click()
    await waitForLoad(page)

    await expect(page.getByText(/adicionada com sucesso/i)).toBeVisible({ timeout: 6_000 })

    await goto(page, '/expenses')
    await expectVisible(page, DESC)
    await expectVisible(page, 'R$ 47,50')
  })

  test('B2 — Editar despesa atualiza descrição e valor', async ({ page }) => {
    await goto(page, '/expenses')
    await waitForLoad(page)

    // Clica no link "Editar" da linha da despesa criada em B1
    const row = page.locator('.space-y-2 > div').filter({ hasText: DESC }).first()
    await row.getByRole('link', { name: 'Editar' }).click()
    await page.waitForURL('**/expenses/**', { timeout: 8_000 })
    await waitForLoad(page)

    const descInput = page.locator('input[placeholder="Ex: Almoço no restaurante"]')
    await descInput.clear()
    await descInput.fill(DESC_EDIT)

    const amountInput = page.locator('input[type="number"]')
    await amountInput.clear()
    await amountInput.fill('99')

    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await waitForLoad(page, 2000) // redirects to /dashboard after save

    await goto(page, '/expenses')
    await waitForLoad(page)

    await expectVisible(page, DESC_EDIT)
    await expectVisible(page, 'R$ 99,00')
  })

  test('B3 — Excluir despesa remove da lista (confirmação de 2 passos)', async ({ page }) => {
    await goto(page, '/expenses')
    await waitForLoad(page)

    const row = page.locator('.space-y-2 > div').filter({ hasText: DESC_EDIT }).first()

    // 1º clique: abre confirmação inline
    await row.getByRole('button', { name: 'Excluir' }).click()
    await waitForLoad(page, 500)

    // 2º clique: confirma — scoped na mesma linha
    await row.getByRole('button', { name: 'Excluir' }).click()
    await waitForLoad(page)

    await expectGone(page, DESC_EDIT)
  })

  test('B4 — Filtro por categoria reduz a lista', async ({ page }) => {
    await goto(page, '/expenses')

    await page.getByRole('button', { name: /Filtrar/i }).click()
    await expect(page.getByText('Filtros')).toBeVisible()

    const select = page.locator('select')
    const options = await select.locator('option').all()
    if (options.length > 1) {
      const val = await options[1].getAttribute('value')
      await select.selectOption(val!)
      await waitForLoad(page, 500)
      await expect(page.getByText(/filtrado/i)).toBeVisible({ timeout: 4_000 })
    }

    await page.getByRole('button', { name: /Limpar/i }).first().click()
    await expect(page.getByText(/filtrado/i)).not.toBeVisible()
  })
})
