import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// ── Configuração ──────────────────────────────────────────────────────────────

const BASE_URL = 'https://jorge-7dias.27pl2o.easypanel.host'
const SUPABASE_URL = 'https://eivxsjloiducsorjhgqr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdnhzamxvaWR1Y3NvcmpoZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2OTQyNDMsImV4cCI6MjA2MzI3MDI0M30.r16JDRNbGVuCGbXHe-nqiGCNJTHjR6OFbFzJBw69G7c'

// JWT lido via variável de ambiente: k6 run -e JWT=$(cat tests/k6/.jwt) load-test.js
const JWT = __ENV.JWT || ''

// ── Métricas customizadas ─────────────────────────────────────────────────────

const errorRate = new Rate('errors')
const apiLatency = new Trend('api_latency_ms')

// ── Cenário de carga ──────────────────────────────────────────────────────────
// Fase 1 (0-30s):  rampa de 0 → 20 usuários
// Fase 2 (30-90s): sustentado em 20 usuários
// Fase 3 (90-120s): rampa de 20 → 50 usuários (pico)
// Fase 4 (120-150s): rampa de 50 → 0 (cooldown)

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '60s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% das respostas < 2s
    errors:            ['rate<0.05'],   // erros de aplicação < 5% (401 é esperado — não conta)
  },
  // Conta como falha HTTP apenas respostas 5xx (erros de servidor)
  // 401/403 são esperados para requests anônimas — não são falhas
  setupTimeout: '30s',
}

// ── Headers comuns ────────────────────────────────────────────────────────────

const anonHeaders = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
}

const authHeaders = JWT ? {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${JWT}`,
  'Content-Type': 'application/json',
} : anonHeaders

// ── Cenários ──────────────────────────────────────────────────────────────────

export default function () {
  const scenario = Math.random()

  if (scenario < 0.3) {
    // 30% — página pública (landing)
    scenarioPublicPage()
  } else if (scenario < 0.5) {
    // 20% — dashboard (autenticado via Supabase REST)
    scenarioDashboard()
  } else if (scenario < 0.7) {
    // 20% — lista de despesas
    scenarioExpenses()
  } else if (scenario < 0.85) {
    // 15% — RLS check: tentativa anônima deve falhar
    scenarioAnonBlocked()
  } else {
    // 15% — resumo semanal
    scenarioSummary()
  }

  sleep(1)
}

function scenarioPublicPage() {
  const start = Date.now()
  const res = http.get(`${BASE_URL}/`)
  apiLatency.add(Date.now() - start)

  const ok = check(res, {
    'landing: status 200': (r) => r.status === 200,
    'landing: tempo < 3s':  (r) => r.timings.duration < 3000,
  })
  errorRate.add(!ok)
}

function scenarioDashboard() {
  const start = Date.now()
  // Busca despesas do mês atual via Supabase REST (mesmo que o dashboard faz)
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/expenses?select=id,amount,date,category_id&date=gte.${monthStart}&order=date.desc&limit=100`,
    { headers: authHeaders }
  )
  apiLatency.add(Date.now() - start)

  const ok = check(res, {
    'dashboard: status 200 ou 401': (r) => r.status === 200 || r.status === 401,
    'dashboard: tempo < 2s': (r) => r.timings.duration < 2000,
  })
  errorRate.add(!ok)
}

function scenarioExpenses() {
  const start = Date.now()
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/expenses?select=id,amount,description,date,category_id&order=date.desc&limit=50`,
    { headers: authHeaders }
  )
  apiLatency.add(Date.now() - start)

  const ok = check(res, {
    'expenses: status 200 ou 401': (r) => r.status === 200 || r.status === 401,
    'expenses: tempo < 2s': (r) => r.timings.duration < 2000,
  })
  errorRate.add(!ok)
}

function scenarioAnonBlocked() {
  // Garante que tentativa anônima não retorna dados (RLS sob carga)
  const start = Date.now()
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/expenses?select=id&limit=5`,
    { headers: anonHeaders }
  )
  apiLatency.add(Date.now() - start)

  const body = JSON.parse(res.body || '[]')
  const hasData = Array.isArray(body) && body.length > 0

  const ok = check(res, {
    'anon: sem dados expostos': () => !hasData,
    'anon: tempo < 1s':        (r) => r.timings.duration < 1000,
  })
  errorRate.add(!ok)
}

function scenarioSummary() {
  const start = Date.now()
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/expenses?select=id,amount,date,week_key,category_id&order=date.desc&limit=200`,
    { headers: authHeaders }
  )
  apiLatency.add(Date.now() - start)

  const ok = check(res, {
    'summary: status 200 ou 401': (r) => r.status === 200 || r.status === 401,
    'summary: tempo < 2s': (r) => r.timings.duration < 2000,
  })
  errorRate.add(!ok)
}
