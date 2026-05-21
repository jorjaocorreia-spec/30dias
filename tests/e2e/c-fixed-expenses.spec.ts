import { test, expect } from '@playwright/test'
import { TAG, goto, waitForLoad, expectVisible } from './helpers'

const FE_DESC = `${TAG} Aluguel teste`
const MONTHLY = 400   // → R$ 100/sem (400/4)
const MONTHLY_2 = 800 // → R$ 200/sem (800/4)

test.describe.serial('C — Despesas Fixas: CRUD e sincronização', () => {
  test('C1 — Criar template de despesa fixa', async ({ page }) => {
    await goto(page, '/fixed-expenses')

    await page.getByRole('button', { name: /^Nova$/ }).click()
    await waitForLoad(page, 500)

    // Descrição: campo de texto com placeholder similar
    await page.locator('input[type="text"]').first().fill(FE_DESC)
    await page.locator('input[type="number"]').first().fill(String(MONTHLY))

    // Categoria: select (primeiro select da página)
    const catSelect = page.locator('select').first()
    const opts = await catSelect.locator('option').all()
    if (opts.length > 1) await catSelect.selectOption(await opts[1].getAttribute('value') ?? '')

    await page.getByRole('button', { name: /Criar|Salvar/i }).first().click()
    await waitForLoad(page)

    await expectVisible(page, FE_DESC)
  })

  test('C2 — Registrar mês gera entradas semanais na lista de despesas', async ({ page }) => {
    await goto(page, '/fixed-expenses')

    // Clicar "Registrar" no card pendente do template
    const pendingRow = page.locator('div').filter({ hasText: FE_DESC }).first()
    await pendingRow.getByRole('button', { name: 'Registrar' }).click()
    await waitForLoad(page, 500)

    // Modal de registro — preenche valor e confirma
    const amountInput = page.locator('input[type="number"]').last()
    await amountInput.clear()
    await amountInput.fill(String(MONTHLY))
    await page.getByRole('button', { name: 'Confirmar' }).click()
    await waitForLoad(page, 2500)

    // Lista de despesas deve ter entradas com badge Fixa e valor R$ 100,00
    await goto(page, '/expenses')
    await expect(page.getByText('🔁 Fixa').first()).toBeVisible({ timeout: 8_000 })
    await expectVisible(page, 'R$ 100,00')
  })

  test('C3 — Editar valor do mês remove entradas antigas e gera novas (regressão)', async ({ page }) => {
    await goto(page, '/fixed-expenses')

    // Encontra o card do template na lista (seção abaixo dos pendentes)
    const templateCard = page.locator('.space-y-2 > div').filter({ hasText: FE_DESC }).first()

    // Expande o histório clicando no botão de colapso (primeiro botão do card)
    await templateCard.locator('button').first().click()
    await waitForLoad(page, 600)

    // Dentro do histórico expandido, clica "Editar" no mês registrado
    // (primeiro "Editar" dentro do card = no histórico de meses)
    await templateCard.getByRole('button', { name: 'Editar' }).first().click()
    await waitForLoad(page, 500)

    // Modal de registro aparece — altera valor para R$ 800
    const amountInput = page.locator('input[type="number"]').last()
    await amountInput.clear()
    await amountInput.fill(String(MONTHLY_2))
    await page.getByRole('button', { name: 'Confirmar' }).click()
    await waitForLoad(page, 3000) // aguarda await do Supabase delete + syncFixedExpenses

    // Verifica na lista de despesas
    await goto(page, '/expenses')

    // Novo valor: R$ 200,00 (800/4)
    await expectVisible(page, 'R$ 200,00')

    // Antigo valor: entradas Fixa com R$ 100,00 deste template não devem mais existir
    const staleEntries = page.locator('.space-y-2 > div')
      .filter({ hasText: '🔁 Fixa' })
      .filter({ hasText: 'R$ 100,00' })
      .filter({ hasText: FE_DESC })
    await expect(staleEntries).toHaveCount(0, { timeout: 6_000 })
  })

  test('C4 — Excluir template remove entradas fixas em cascata', async ({ page }) => {
    await goto(page, '/fixed-expenses')

    const templateCard = page.locator('.space-y-2 > div').filter({ hasText: FE_DESC }).first()

    // Clica na lixeira do template (abre confirmação inline)
    await templateCard.getByRole('button', { name: 'Excluir' }).click()
    await waitForLoad(page, 300)

    // Confirma (botão "Excluir" no estado de confirmação)
    await templateCard.getByRole('button', { name: 'Excluir' }).click()
    await waitForLoad(page, 1500)

    await expect(page.getByText(FE_DESC)).not.toBeVisible({ timeout: 6_000 })

    // Entradas fixas deste template devem sumir
    await goto(page, '/expenses')
    const fixedEntries = page.locator('.space-y-2 > div')
      .filter({ hasText: '🔁 Fixa' })
      .filter({ hasText: 'R$ 200,00' })
      .filter({ hasText: FE_DESC })
    await expect(fixedEntries).toHaveCount(0, { timeout: 6_000 })
  })
})
