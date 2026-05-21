import { test, expect } from '@playwright/test'
import { goto, waitForLoad, expectVisible, expectGone } from './helpers'

// Serial: testes dependem da ordem (F1 cria, F2 edita, F3 exclui)
// TAG fixo no módulo — não muda entre retries dentro da run
const CAT_NAME = `[e2e-${process.env.PW_TEST_WORKER_INDEX ?? 0}-${Math.floor(Date.now() / 60000)}] Academia`

test.describe.serial('F — Categorias', () => {
  test('F1 — Criar categoria aparece na lista e no form de despesa', async ({ page }) => {
    await goto(page, '/categories')

    await page.getByRole('button', { name: /^Nova$/ }).click()
    await expect(page.getByText('Nova categoria')).toBeVisible()

    await page.fill('input[placeholder="Ex: Academia"]', CAT_NAME)
    await page.getByRole('button', { name: 'Criar categoria' }).click()
    await waitForLoad(page)

    await expectVisible(page, CAT_NAME)

    // Verifica que aparece no form de despesa
    await goto(page, '/expenses/new')
    await expectVisible(page, CAT_NAME)
  })

  test('F2 — Editar categoria atualiza a lista', async ({ page }) => {
    await goto(page, '/categories')
    await expectVisible(page, CAT_NAME)

    // Encontrar a linha da lista que contém exatamente nossa categoria
    const row = page.locator('.space-y-2 > div').filter({ hasText: CAT_NAME })
    await row.locator('button').first().click() // botão lápis (1º botão na linha)

    await expect(page.getByText('Editar categoria')).toBeVisible({ timeout: 6_000 })

    const input = page.locator('input[placeholder="Ex: Academia"]')
    await input.clear()
    await input.fill(`${CAT_NAME} Ed`)

    await page.getByRole('button', { name: 'Salvar alterações' }).click()
    await waitForLoad(page)

    await expectVisible(page, `${CAT_NAME} Ed`)
  })

  test('F3 — Excluir categoria remove da lista', async ({ page }) => {
    await goto(page, '/categories')
    await expectVisible(page, `${CAT_NAME} Ed`)

    const row = page.locator('.space-y-2 > div').filter({ hasText: `${CAT_NAME} Ed` })
    // Lixeira é o 2º botão (o 1º é o lápis)
    await row.locator('button').nth(1).click()
    await waitForLoad(page)

    await expectGone(page, `${CAT_NAME} Ed`)
  })
})
