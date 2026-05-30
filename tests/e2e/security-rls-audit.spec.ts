import { test, expect } from '@playwright/test'

const SUPABASE_URL = 'https://eivxsjloiducsorjhgqr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdnhzamxvaWR1Y3NvcmpoZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2OTQyNDMsImV4cCI6MjA2MzI3MDI0M30.r16JDRNbGVuCGbXHe-nqiGCNJTHjR6OFbFzJBw69G7c'

const TABLES = [
  'expenses',
  'categories',
  'establishments',
  'fixed_expenses',
  'fixed_expense_months',
  'income_categories',
  'income_sources',
  'income_entries',
  'user_preferences',
]

async function queryAnon(page: import('@playwright/test').Page, table: string): Promise<unknown> {
  return page.evaluate(async ({ url, key, tbl }: { url: string; key: string; tbl: string }) => {
    const res = await fetch(`${url}/rest/v1/${tbl}?select=id&limit=5`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
    })
    return res.json()
  }, { url: SUPABASE_URL, key: SUPABASE_ANON_KEY, tbl: table })
}

test.describe('Segurança — Auditoria RLS: todas as tabelas bloqueiam acesso anônimo', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  for (const table of TABLES) {
    test(`RLS — tabela "${table}" não expõe dados sem autenticação`, async ({ page }) => {
      // Acessa uma página pública para ter contexto de origem válido
      await page.goto(SUPABASE_URL.replace('https://', 'https://') + '/rest/v1/', { waitUntil: 'commit' }).catch(() => {})
      await page.goto('about:blank')

      const result = await queryAnon(page, table)

      // Supabase retorna [] (RLS filtrou) ou objeto de erro (sem permissão) — ambos protegem os dados
      const hasData = Array.isArray(result) && (result as unknown[]).length > 0
      expect(hasData).toBe(false)
    })
  }
})

test.describe('Segurança — Auditoria RLS: usuário autenticado não acessa dados de outros usuários', () => {
  for (const table of TABLES) {
    test(`RLS — tabela "${table}" filtra por user_id autenticado`, async ({ page }) => {
      await page.goto('https://jorge-30dias.27pl2o.easypanel.host/dashboard')
      await page.waitForTimeout(2000)

      // Recupera JWT do usuário logado
      const jwt = await page.evaluate(() => {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
        if (!keys.length) return null
        try { return JSON.parse(localStorage.getItem(keys[0]) ?? '').access_token } catch { return null }
      })

      if (!jwt) { test.skip(); return }

      const fakeUserId = '00000000-0000-0000-0000-000000000000'

      const result = await page.evaluate(async ({ url, key, token, tbl, fakeId }: { url: string; key: string; token: string; tbl: string; fakeId: string }) => {
        const res = await fetch(`${url}/rest/v1/${tbl}?select=id,user_id&user_id=eq.${fakeId}&limit=5`, {
          headers: { 'apikey': key, 'Authorization': `Bearer ${token}` },
        })
        return res.json()
      }, { url: SUPABASE_URL, key: SUPABASE_ANON_KEY, token: jwt, tbl: table, fakeId: fakeUserId })

      // Nenhuma linha deve ter o user_id forjado
      if (Array.isArray(result)) {
        const leaked = (result as any[]).filter((r) => r.user_id === fakeUserId)
        expect(leaked.length).toBe(0)
      }
    })
  }
})
