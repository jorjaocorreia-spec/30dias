import type { SupabaseClient } from '@supabase/supabase-js'
import { getWeekKey } from '@/lib/weekHelpers'

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

const fmtDate = (dateStr: string) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

// BRT = UTC-3; all date/week computations use local BRT time
function getBRTDateStr(): string {
  const brt = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const y = brt.getUTCFullYear()
  const m = String(brt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(brt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getBRTMonthStr(): string {
  return getBRTDateStr().slice(0, 7)
}

function effectiveAmt(row: { amount: number; shared_with?: any }): number {
  const sw = Array.isArray(row.shared_with) ? row.shared_with : []
  return row.amount - sw.reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
}

// ── Week ──────────────────────────────────────────────────────────────────────

export async function handleWeekQuery(userId: string, admin: SupabaseClient): Promise<string> {
  const todayStr = getBRTDateStr()
  const weekKey = getWeekKey(todayStr)

  const [{ data: expenses }, { data: prefs }] = await Promise.all([
    admin
      .from('expenses')
      .select('amount, shared_with')
      .eq('user_id', userId)
      .eq('week_key', weekKey),
    admin
      .from('user_preferences')
      .select('weekly_budget')
      .eq('user_id', userId)
      .single(),
  ])

  const spent = (expenses ?? []).reduce((s, e) => s + effectiveAmt(e), 0)
  const budget: number = prefs?.weekly_budget ?? 0
  const remaining = budget - spent
  const pct = budget > 0 ? Math.round((remaining / budget) * 100) : 0
  const emoji = pct >= 50 ? '✅' : pct >= 20 ? '⚠️' : '🚨'

  return [
    `📊 *Semana atual* (${weekKey})`,
    `💸 Gasto: ${fmt(spent)}`,
    `💰 Orçamento: ${fmt(budget)}`,
    `${emoji} Disponível: ${fmt(remaining)} (${pct}% livre)`,
  ].join('\n')
}

// ── Month ─────────────────────────────────────────────────────────────────────

export async function handleMonthQuery(userId: string, admin: SupabaseClient): Promise<string> {
  const month = getBRTMonthStr()
  const nextMonth = (() => {
    const [y, m] = month.split('-').map(Number)
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
  })()

  const [{ data: expenses }, { data: incomeEntries }] = await Promise.all([
    admin
      .from('expenses')
      .select('amount, shared_with')
      .eq('user_id', userId)
      .gte('date', `${month}-01`)
      .lt('date', `${nextMonth}-01`),
    admin
      .from('income_entries')
      .select('amount')
      .eq('user_id', userId)
      .eq('month', month),
  ])

  const totalExpenses = (expenses ?? []).reduce((s, e) => s + effectiveAmt(e), 0)
  const totalIncome = (incomeEntries ?? []).reduce((s, e) => s + (e.amount ?? 0), 0)
  const balance = totalIncome - totalExpenses
  const balanceEmoji = balance >= 0 ? '✅' : '🚨'

  const [mStr, yStr] = (() => {
    const [y, m] = month.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    return [
      d.toLocaleDateString('pt-BR', { month: 'long' }),
      y,
    ]
  })()

  return [
    `📅 *${mStr.charAt(0).toUpperCase() + mStr.slice(1)} ${yStr}*`,
    `💵 Receitas: ${fmt(totalIncome)}`,
    `💸 Despesas: ${fmt(totalExpenses)}`,
    `${balanceEmoji} Saldo: ${fmt(balance)}`,
  ].join('\n')
}

// ── Pending ───────────────────────────────────────────────────────────────────

export async function handlePendingQuery(userId: string, admin: SupabaseClient): Promise<string> {
  const month = getBRTMonthStr()
  const nextMonth = (() => {
    const [y, m] = month.split('-').map(Number)
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
  })()

  const { data: expenses } = await admin
    .from('expenses')
    .select('description, date, shared_with')
    .eq('user_id', userId)
    .gte('date', `${month}-01`)
    .lt('date', `${nextMonth}-01`)
    .not('shared_with', 'is', null)

  type PendingItem = { name: string; amount: number; description: string; date: string }
  const pending: PendingItem[] = []

  for (const exp of expenses ?? []) {
    const sw = Array.isArray(exp.shared_with) ? exp.shared_with : []
    for (const p of sw) {
      if (!p.paid && typeof p.amount === 'number' && p.amount > 0) {
        pending.push({
          name: p.name ?? 'Participante',
          amount: p.amount,
          description: exp.description ?? '',
          date: exp.date ?? '',
        })
      }
    }
  }

  if (pending.length === 0) {
    return `💳 *A receber — sem pendências este mês* ✅`
  }

  const total = pending.reduce((s, p) => s + p.amount, 0)
  const MAX = 5
  const shown = pending.slice(0, MAX)
  const extra = pending.length - MAX

  const lines = [
    `💳 *A receber — ${month.split('-').reverse().join('/')}*`,
    ...shown.map(p => `• ${p.name} → ${fmt(p.amount)} _(${p.description}, ${fmtDate(p.date)})_`),
    ...(extra > 0 ? [`_+${extra} mais..._`] : []),
    `*Total: ${fmt(total)}*`,
  ]

  return lines.join('\n')
}

// ── Summary ───────────────────────────────────────────────────────────────────

export async function handleSummaryQuery(userId: string, admin: SupabaseClient): Promise<string> {
  const [weekMsg, monthMsg] = await Promise.all([
    handleWeekQuery(userId, admin),
    handleMonthQuery(userId, admin),
  ])

  // Extract just the key line from each (compact version)
  const weekLines = weekMsg.split('\n')
  const monthLines = monthMsg.split('\n')

  return [
    weekLines[0],
    weekLines[1], // Gasto
    weekLines[3], // Disponível
    '',
    monthLines[0],
    monthLines[1], // Receitas
    monthLines[2], // Despesas
    monthLines[3], // Saldo
  ].join('\n')
}

// ── Help ──────────────────────────────────────────────────────────────────────

export function handleHelp(): string {
  return [
    '🤖 *7Dias — Comandos disponíveis*',
    '',
    '*Registrar despesa:*',
    '_"gastei 50 no mercado no pix"_',
    '_"paguei 30 de Uber no cartão"_',
    '',
    '*Registrar receita:*',
    '_"recebi 150 do IRPF"_',
    '_"recebimento 2000 salário via ted"_',
    '_"ganhei 500 de freela"_',
    '',
    '*Consultas:*',
    '• "semana" → saldo da semana atual',
    '• "mês" → balanço mensal',
    '• "receber" → valores a receber',
    '• "resumo" → visão compacta semana + mês',
    '• "ajuda" → esta mensagem',
  ].join('\n')
}
