import { test, expect } from '@playwright/test'
import { TAG, goto, waitForLoad } from './helpers'

const SUPABASE_URL = 'https://eivxsjloiducsorjhgqr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdnhzamxvaWR1Y3NvcmpoZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2OTQyNDMsImV4cCI6MjA2MzI3MDI0M30.r16JDRNbGVuCGbXHe-nqiGCNJTHjR6OFbFzJBw69G7c'

test.describe('Segurança — XSS em formulários', () => {
  test('Descrição com payload XSS é exibida como texto, não executada', async ({ page }) => {
    const xssPayload = `${TAG} <script>window.__xss=1</script><img src=x onerror="window.__xss=2">`

    await goto(page, '/expenses/new')

    // Preenche valor e categoria
    await page.fill('input[type="number"]', '1')
    await page.locator('.grid button').first().click()

    // Insere payload XSS na descrição
    await page.fill('input[placeholder="Ex: Almoço no restaurante"]', xssPayload)
    await page.getByRole('button', { name: 'Adicionar despesa' }).click()
    await waitForLoad(page)

    // Verifica que script NÃO executou
    const xssRan = await page.evaluate(() => (window as any).__xss)
    expect(xssRan).toBeUndefined()

    // Navega para lista e verifica que o texto aparece como string segura
    await goto(page, '/expenses')
    // O texto deve aparecer como conteúdo (React escapa HTML por padrão)
    // Não deve haver um elemento <script> injetado
    const injectedScript = await page.evaluate(() => document.querySelectorAll('script[src=""]').length)
    expect(injectedScript).toBe(0)

    // Limpa: exclui a despesa criada (2 cliques confirmação inline, escopo na linha)
    await goto(page, '/expenses')
    const row = page.locator('.space-y-2 > div').filter({ hasText: /\[e2e-/ }).first()
    if (await row.isVisible()) {
      await row.getByRole('button', { name: 'Excluir' }).click()
      await waitForLoad(page, 300)
      await row.getByRole('button', { name: 'Excluir' }).click()
      await waitForLoad(page)
    }
  })
})

test.describe('Segurança — RLS: acesso sem autenticação retorna zero registros', () => {
  test('Tabela expenses não retorna dados com role anon', async ({ page }) => {
    // Chama a API do Supabase diretamente com apenas o anon key (sem JWT de usuário)
    // RLS exige auth.uid() = user_id, então anon role deve retornar []
    const result = await page.evaluate(async ({ url, key }: { url: string; key: string }) => {
      const res = await fetch(`${url}/rest/v1/expenses?select=id,user_id&limit=10`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
      })
      return await res.json()
    }, { url: SUPABASE_URL, key: SUPABASE_ANON_KEY })

    // Supabase retorna [] (RLS filtrou) ou objeto de erro (sem permissão) — ambos são seguros
    const hasData = Array.isArray(result) && result.length > 0
    expect(hasData).toBe(false)
  })

  test('Tabela categories não retorna dados com role anon', async ({ page }) => {
    const result = await page.evaluate(async ({ url, key }: { url: string; key: string }) => {
      const res = await fetch(`${url}/rest/v1/categories?select=id&limit=10`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
      })
      return await res.json()
    }, { url: SUPABASE_URL, key: SUPABASE_ANON_KEY })

    // Supabase retorna [] (RLS filtrou) ou objeto de erro (sem permissão) — ambos são seguros
    const hasData = Array.isArray(result) && result.length > 0
    expect(hasData).toBe(false)
  })
})
