import { test, expect } from '@playwright/test'

// Estes testes rodam SEM storageState (usuário não autenticado)
test.use({ storageState: { cookies: [], origins: [] } })

const PROTECTED = ['/dashboard', '/expenses', '/expenses/new', '/categories', '/establishments', '/fixed-expenses', '/income', '/summary', '/budget']

test.describe('Segurança — Proteção de rotas', () => {
  for (const route of PROTECTED) {
    test(`Rota ${route} redireciona para / sem autenticação`, async ({ page }) => {
      await page.goto(route)
      // Aguarda redirect (client-side guard em (app)/layout.tsx)
      await page.waitForURL('**/', { timeout: 10_000 })
      // Confirma que está na landing (tem o form de login)
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 6_000 })
    })
  }
})
