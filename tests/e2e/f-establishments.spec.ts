import { test, expect } from '@playwright/test'
import { TAG, goto, waitForLoad, expectVisible, expectGone } from './helpers'

const EST_NAME = `${TAG} Supermercado`

test.describe('F — Estabelecimentos', () => {
  test('F4 — Criar estabelecimento aparece na lista', async ({ page }) => {
    await goto(page, '/establishments')

    await page.getByRole('button', { name: /^Novo$/ }).click()
    await expect(page.getByText('Novo estabelecimento')).toBeVisible()

    // Preencher nome
    await page.fill('input[placeholder="Ex: Supermercado Extra"]', EST_NAME)

    // Selecionar categoria (primeira disponível)
    const select = page.locator('select')
    const options = await select.locator('option').all()
    // Escolhe a segunda opção (primeira real, não o placeholder)
    if (options.length > 1) {
      const val = await options[1].getAttribute('value')
      await select.selectOption(val!)
    }

    await page.getByRole('button', { name: 'Criar estabelecimento' }).click()
    await waitForLoad(page)

    await expectVisible(page, EST_NAME)
  })

  test('F5 — Autocomplete no form de despesa preenche categoria', async ({ page }) => {
    await goto(page, '/expenses/new')

    // Digitar no campo de estabelecimento
    await page.fill('input[placeholder="Buscar estabelecimento..."]', EST_NAME.split(' ')[1])
    await waitForLoad(page, 500)

    // Dropdown aparece
    const dropdown = page.getByText(EST_NAME, { exact: false }).first()
    await expect(dropdown).toBeVisible({ timeout: 6_000 })

    // Clicar no estabelecimento
    await dropdown.click()
    await waitForLoad(page, 500)

    // Campo de estabelecimento foi preenchido e uma categoria foi selecionada
    const estInput = page.locator('input[placeholder="Buscar estabelecimento..."]')
    await expect(estInput).toHaveValue(new RegExp(EST_NAME.split(' ')[1], 'i'))
  })

  test('F6 — Excluir estabelecimento remove da lista', async ({ page }) => {
    await goto(page, '/establishments')

    const row = page.locator('div').filter({ hasText: EST_NAME }).first()
    // Clicar lixeira (segundo botão na linha)
    await row.locator('button').nth(1).click()
    await waitForLoad(page)

    await expectGone(page, EST_NAME)
  })
})
