import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage'

// Retorna datas BRT: hoje e amanhã como { day, month, year, dateStr }
function brazilDates(): {
  today: { day: number; month: number; year: number; dateStr: string }
  tomorrow: { day: number; month: number; year: number; dateStr: string }
} {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const todayYear = now.getUTCFullYear()
  const todayMonth = now.getUTCMonth() + 1
  const todayDay = now.getUTCDate()

  // amanhã respeitando virada de mês/ano
  const tmr = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay + 1))
  const tmrYear = tmr.getUTCFullYear()
  const tmrMonth = tmr.getUTCMonth() + 1
  const tmrDay = tmr.getUTCDate()

  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    today: {
      day: todayDay, month: todayMonth, year: todayYear,
      dateStr: `${todayYear}-${pad(todayMonth)}-${pad(todayDay)}`,
    },
    tomorrow: {
      day: tmrDay, month: tmrMonth, year: tmrYear,
      dateStr: `${tmrYear}-${pad(tmrMonth)}-${pad(tmrDay)}`,
    },
  }
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  if (digits.length === 10 || digits.length === 11) return '55' + digits
  return digits
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function effectiveDueDay(dueDateDay: number, year: number, month: number): number {
  return Math.min(dueDateDay, lastDayOfMonth(year, month))
}

function formatAmount(amount: number): string {
  return `R$ ${amount.toFixed(2).replace('.', ',')}`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = req.nextUrl.searchParams.get('dry_run') === 'true'
  const { today, tomorrow } = brazilDates()
  const currentMonth = `${today.year}-${String(today.month).padStart(2, '0')}`

  // ── 1. Despesas FIXAS ativas com due_date_day ──────────────────────────────
  // reminder_enabled = false funciona como opt-out explícito
  const { data: fixedExpenses, error: feError } = await supabaseAdmin
    .from('fixed_expenses')
    .select('id, user_id, description, suggested_amount, due_date_day, reminder_enabled')
    .eq('is_active', true)
    .not('due_date_day', 'is', null)
    .neq('reminder_enabled', false)  // exclui somente quem desativou explicitamente

  if (feError) {
    console.error('[cron-reminders] fetch fixed_expenses:', feError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // ── 2. Despesas VARIÁVEIS com data hoje ou amanhã (lançadas com data futura) ─
  const { data: variableExpenses, error: veError } = await supabaseAdmin
    .from('expenses')
    .select('id, user_id, description, amount, category_id, date')
    .in('date', [today.dateStr, tomorrow.dateStr])

  if (veError) {
    console.error('[cron-reminders] fetch variable expenses:', veError)
    // não aborta — continua com fixas
  }

  // ── 3. Coletar todos os user_ids envolvidos ─────────────────────────────────
  const userIdsSet = new Set<string>()

  const fixedByUser: Record<string, {
    todayItems: { description: string; amount: number }[]
    tomorrowItems: { description: string; amount: number }[]
  }> = {}

  for (const fe of fixedExpenses ?? []) {
    const effDayToday = effectiveDueDay(fe.due_date_day, today.year, today.month)
    const effDayTomorrow = effectiveDueDay(fe.due_date_day, tomorrow.year, tomorrow.month)
    const isToday = effDayToday === today.day
    const isTomorrow = effDayTomorrow === tomorrow.day

    if (!isToday && !isTomorrow) continue

    userIdsSet.add(fe.user_id)
    if (!fixedByUser[fe.user_id]) fixedByUser[fe.user_id] = { todayItems: [], tomorrowItems: [] }
    const placeholder = { description: fe.description, amount: fe.suggested_amount ?? 0 }
    if (isToday) fixedByUser[fe.user_id].todayItems.push(placeholder)
    else fixedByUser[fe.user_id].tomorrowItems.push(placeholder)
  }

  // Sobrescreve suggested_amount com valor confirmado do mês corrente (fixas)
  const feIds = (fixedExpenses ?? []).map(fe => fe.id)
  if (feIds.length > 0) {
    const { data: months } = await supabaseAdmin
      .from('fixed_expense_months')
      .select('fixed_expense_id, amount')
      .eq('month', currentMonth)
      .in('fixed_expense_id', feIds)

    const confirmedAmount: Record<string, number> = {}
    for (const m of months ?? []) confirmedAmount[m.fixed_expense_id] = m.amount

    // re-aplica valores confirmados
    for (const fe of fixedExpenses ?? []) {
      if (!confirmedAmount[fe.id]) continue
      const bucket = fixedByUser[fe.user_id]
      if (!bucket) continue
      for (const arr of [bucket.todayItems, bucket.tomorrowItems]) {
        const item = arr.find(x => x.description === fe.description)
        if (item) item.amount = confirmedAmount[fe.id]
      }
    }
  }

  // ── 4. Despesas variáveis ──────────────────────────────────────────────────
  const variableByUser: Record<string, {
    todayItems: { description: string; amount: number }[]
    tomorrowItems: { description: string; amount: number }[]
  }> = {}

  for (const ve of variableExpenses ?? []) {
    userIdsSet.add(ve.user_id)
    if (!variableByUser[ve.user_id]) variableByUser[ve.user_id] = { todayItems: [], tomorrowItems: [] }
    const item = { description: ve.description, amount: ve.amount }
    if (ve.date === today.dateStr) variableByUser[ve.user_id].todayItems.push(item)
    else variableByUser[ve.user_id].tomorrowItems.push(item)
  }

  const userIds = Array.from(userIdsSet)
  if (!userIds.length) {
    return NextResponse.json({ sent: 0, reason: 'no due dates match today/tomorrow', date: today.dateStr })
  }

  // ── 5. Busca números WhatsApp ──────────────────────────────────────────────
  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('user_id, whatsapp_number')
    .in('user_id', userIds)

  const phoneByUser: Record<string, string> = {}
  for (const p of prefs ?? []) {
    if (p.whatsapp_number) phoneByUser[p.user_id] = p.whatsapp_number
  }

  // ── 6. Envia uma mensagem consolidada por usuário ──────────────────────────
  let sentCount = 0
  const errors: string[] = []
  const dryRunMessages: { phone: string; message: string }[] = []

  for (const userId of userIds) {
    const rawPhone = phoneByUser[userId]
    if (!rawPhone) continue

    const fixed = fixedByUser[userId] ?? { todayItems: [], tomorrowItems: [] }
    const variable = variableByUser[userId] ?? { todayItems: [], tomorrowItems: [] }

    const allToday = [...fixed.todayItems, ...variable.todayItems]
    const allTomorrow = [...fixed.tomorrowItems, ...variable.tomorrowItems]

    if (!allToday.length && !allTomorrow.length) continue

    const lines: string[] = []

    if (allToday.length > 0) {
      lines.push('🔴 *Vence HOJE:*')
      for (const item of allToday) {
        const amountStr = item.amount > 0 ? ` — ${formatAmount(item.amount)}` : ''
        lines.push(`  • ${item.description}${amountStr}`)
      }
    }

    if (allTomorrow.length > 0) {
      if (lines.length > 0) lines.push('')
      lines.push('⚠️ *Vence amanhã:*')
      for (const item of allTomorrow) {
        const amountStr = item.amount > 0 ? ` — ${formatAmount(item.amount)}` : ''
        lines.push(`  • ${item.description}${amountStr}`)
      }
    }

    const message = `💳 *30dias — Lembrete de vencimento*\n\n${lines.join('\n')}`
    const phone = normalizePhone(rawPhone)

    if (dryRun) {
      dryRunMessages.push({ phone, message })
      continue
    }

    try {
      await sendWhatsAppMessage(phone, message)
      sentCount++
      console.log(`[cron-reminders] sent to ${phone}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`phone=${phone} err=${msg}`)
      console.error(`[cron-reminders] failed for ${phone}:`, msg)
    }
  }

  console.log(`[cron-reminders] done sent=${sentCount} errors=${errors.length} date=${today.dateStr}`)

  if (dryRun) {
    return NextResponse.json({ dryRun: true, wouldSend: dryRunMessages.length, messages: dryRunMessages, date: today.dateStr })
  }

  return NextResponse.json({
    sent: sentCount,
    errors: errors.length ? errors : undefined,
    date: today.dateStr,
  })
}
