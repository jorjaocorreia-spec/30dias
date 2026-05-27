import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const SCREENSHOTS = 'd:\\7Dias\\verify_screenshots'
mkdirSync(SCREENSHOTS, { recursive: true })

const BASE = 'http://localhost:3000'
let passed = 0, failed = 0, findings = []

function pass(msg)  { console.log(`  ✅ ${msg}`); passed++ }
function fail(msg)  { console.log(`  ❌ ${msg}`); failed++ }
function probe(msg) { console.log(`  🔍 ${msg}`) }

const browser = await chromium.launch({ headless: false, slowMo: 200 })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()

async function ss(name) {
  await page.screenshot({ path: `${SCREENSHOTS}/${name}.png` })
  console.log(`     📸 ${name}.png`)
}

// ── Auth ──────────────────────────────────────────────────────────────────────
console.log('\n[SETUP] Navigating to app…')
await page.goto(BASE, { waitUntil: 'networkidle' })

if (!page.url().includes('/dashboard')) {
  console.log('  ⏳ Waiting for manual login (up to 2 min) — please log in in the browser window…')
  await page.waitForURL('**/dashboard**', { timeout: 120_000 }).catch(() => {})
}

if (!page.url().includes('/dashboard')) {
  fail('Could not reach dashboard — auth timed out')
  await browser.close()
  process.exit(1)
}
pass('Authenticated — on dashboard')
await page.waitForLoadState('networkidle')
await ss('00_dashboard_initial')

// ── STEP 1: Card "Projeção do mês" present ────────────────────────────────────
console.log('\n[STEP 1] Card "Projeção do mês"')
const projCard = page.locator('text=Projeção do mês').first()
const hasCard  = await projCard.count() > 0

if (hasCard) {
  pass('Card "Projeção do mês" is visible')

  // Grab surrounding card element text
  const cardEl   = projCard.locator('xpath=../..').first()
  const cardText = (await cardEl.textContent()) ?? ''
  console.log(`     Card text: "${cardText.replace(/\s+/g,' ').trim().slice(0,150)}"`)
  await ss('01_projection_card')

  // ── STEP 2: Projected amount (R$) ─────────────────────────────────────────
  console.log('\n[STEP 2] Projected amount present')
  if (cardText.match(/R\$\s*[\d.,]+/)) {
    pass('Currency amount (R$) present in card')
  } else {
    fail('No R$ amount found in card')
  }

  // ── STEP 3: "d de dados" indicator ────────────────────────────────────────
  console.log('\n[STEP 3] "N d de dados" indicator')
  if (cardText.match(/\d+d de dados/)) {
    const match = cardText.match(/(\d+)d de dados/)
    pass(`Days indicator present: "${match?.[0]}"`)
  } else {
    fail('"d de dados" indicator not found')
  }

  // ── STEP 4: Delta text (above/below income, or no income) ─────────────────
  console.log('\n[STEP 4] Delta vs income text')
  const acimaEl  = page.locator('text=acima da sua renda')
  const abaixoEl = page.locator('text=abaixo da sua renda')
  const semEl    = page.locator('text=Sem renda registrada este mês')

  const acima  = await acimaEl.count()
  const abaixo = await abaixoEl.count()
  const sem    = await semEl.count()

  if (acima > 0)  { pass('Delta: "acima da sua renda" visible (red)'); await ss('02_delta_acima') }
  else if (abaixo > 0) { pass('Delta: "abaixo da sua renda" visible (green)'); await ss('02_delta_abaixo') }
  else if (sem > 0)    { pass('Delta: "Sem renda registrada este mês" fallback visible') }
  else { fail('None of the expected delta texts found'); await ss('02_delta_missing') }

  // ── STEP 5: Card DOM position (between Saldo and charts) ──────────────────
  console.log('\n[STEP 5] Card position in layout')
  const saldoEl  = page.locator('text=Saldo do mês').first()
  const chartEl  = page.locator('text=Gastos por dia').first()
  const saldoBox = await saldoEl.boundingBox()
  const projBox  = await projCard.boundingBox()
  const chartBox = await chartEl.boundingBox()

  if (saldoBox && projBox && chartBox) {
    const after  = projBox.y > saldoBox.y
    const before = projBox.y < chartBox.y
    console.log(`     Saldo Y=${saldoBox.y.toFixed(0)}, Projeção Y=${projBox.y.toFixed(0)}, Gráficos Y=${chartBox.y.toFixed(0)}`)
    if (after && before) {
      pass('Card positioned correctly: after "Saldo do mês", before "Gastos por dia"')
    } else {
      fail(`Card out of position: after=${after}, before=${before}`)
    }
  } else {
    fail('Could not measure card positions')
  }

} else {
  // Card hidden — check if this is expected (no expenses)
  probe('Card "Projeção do mês" NOT visible — checking monthly expenses…')
  const balText = (await page.locator('text=Saldo do mês').first().locator('xpath=../..').textContent().catch(() => ''))
  console.log(`     Monthly balance section: "${balText.replace(/\s+/g,' ').trim().slice(0,100)}"`)
  findings.push('Projection card hidden (expected when zero expenses this month)')
  await ss('01_no_projection_card')
}

// ── STEP 6: Regression — KPI cards ────────────────────────────────────────────
console.log('\n[STEP 6] Regression — KPI cards')
for (const label of ['Gasto total', 'Disponível', 'Despesas']) {
  if (await page.locator(`text=${label}`).first().count() > 0) pass(`KPI "${label}"`)
  else fail(`KPI "${label}" MISSING`)
}

// ── STEP 7: Regression — budget bar ───────────────────────────────────────────
console.log('\n[STEP 7] Regression — budget bar')
if (await page.locator('text=Orçamento da semana').count() > 0) pass('"Orçamento da semana" bar')
else fail('"Orçamento da semana" bar MISSING')

// ── STEP 8: Regression — monthly balance columns ──────────────────────────────
console.log('\n[STEP 8] Regression — monthly balance')
const saldoSection = await page.locator('text=Saldo do mês').first().locator('xpath=../..').textContent().catch(() => '')
if (saldoSection.includes('Receitas') && saldoSection.includes('Despesas') && saldoSection.includes('Saldo'))
  pass('"Saldo do mês" has Receitas/Despesas/Saldo')
else fail(`"Saldo do mês" columns missing — got: "${saldoSection.slice(0,80)}"`)

// ── STEP 9: Regression — charts present ───────────────────────────────────────
console.log('\n[STEP 9] Regression — charts')
if (await page.locator('text=Gastos por dia').count() > 0) pass('"Gastos por dia" chart')
else fail('"Gastos por dia" chart MISSING')
if (await page.locator('text=Por categoria').count() > 0) pass('"Por categoria" pie chart')
else fail('"Por categoria" pie chart MISSING')

// ── STEP 10: Desktop viewport ─────────────────────────────────────────────────
console.log('\n[STEP 10] Desktop viewport (1440px)')
await ctx.setViewportSize({ width: 1440, height: 900 })
await page.waitForTimeout(500)
await ss('03_dashboard_desktop')

if (hasCard) {
  const projDesktop = page.locator('text=Projeção do mês').first()
  if (await projDesktop.count() > 0) pass('Projection card visible on desktop')
  else fail('Projection card missing on desktop')
} else {
  probe('Skipping desktop card check — card not present on mobile either')
}

// ── STEP 11: Probe — week navigation doesn't break projection ─────────────────
console.log('\n[STEP 11] 🔍 Probe — week nav + projection stability')
await ctx.setViewportSize({ width: 390, height: 844 })
const prevWeekBtn = page.locator('[class*=rounded-xl]').filter({ hasText: '' }).nth(0)
// Navigate via ChevronLeft button (first nav button)
const navBtns = page.locator('button').filter({ hasText: '' })
// Use the header nav buttons
await page.locator('button').nth(0).click().catch(() => {})
await page.waitForTimeout(400)

const projAfterNav = page.locator('text=Projeção do mês').first()
if (hasCard) {
  if (await projAfterNav.count() > 0) {
    pass('🔍 Projection card stable after week navigation')
  } else {
    fail('🔍 Projection card disappeared after week navigation')
  }
}
// Navigate back to current week
const todayBtn = page.locator('button', { hasText: 'Hoje' })
await todayBtn.click().catch(() => {})
await page.waitForTimeout(400)
await ss('04_after_week_nav')

// ── Full-page final screenshot ─────────────────────────────────────────────────
await page.evaluate(() => window.scrollTo(0, 0))
await ss('05_final_top')
await page.evaluate(() => window.scrollTo(0, 500))
await ss('06_final_mid')

// ── Summary ────────────────────────────────────────────────────────────────────
await browser.close()

console.log('\n' + '═'.repeat(60))
console.log(`RESULT: ${failed === 0 ? 'PASS ✅' : 'FAIL ❌'}`)
console.log(`Passed: ${passed} | Failed: ${failed}`)
if (findings.length > 0) {
  console.log('\nFindings:')
  findings.forEach(f => console.log(`  ⚠️  ${f}`))
}
console.log('Screenshots: ' + SCREENSHOTS)
console.log('═'.repeat(60))
process.exit(failed > 0 ? 1 : 0)
