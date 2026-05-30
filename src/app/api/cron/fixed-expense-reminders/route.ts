import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage'

// Retorna o dia atual no fuso de Brasília (UTC-3)
function brazilToday(): { day: number; year: number; month: number } {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000)
  return {
    day: now.getUTCDate(),
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1, // 1-indexed
  }
}

// Normaliza número para formato Evolution API: somente dígitos com prefixo 55
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  // DDD + número sem código de país
  if (digits.length === 10 || digits.length === 11) return '55' + digits
  return digits
}

// Último dia do mês para normalizar due_date_day (ex: dia 31 em fevereiro → 28)
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

  const { day: todayDay, year, month: monthNum } = brazilToday()
  const currentMonth = `${year}-${String(monthNum).padStart(2, '0')}`
  const tomorrowDay = todayDay + 1

  // Busca todas as despesas fixas ativas com lembrete habilitado
  const { data: fixedExpenses, error: feError } = await supabaseAdmin
    .from('fixed_expenses')
    .select('id, user_id, description, suggested_amount, due_date_day')
    .eq('is_active', true)
    .eq('reminder_enabled', true)
    .not('due_date_day', 'is', null)

  if (feError) {
    console.error('[cron-reminders] fetch fixed_expenses:', feError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
  if (!fixedExpenses?.length) {
    return NextResponse.json({ sent: 0, reason: 'no active reminders' })
  }

  // Agrupa por usuário separando "vence hoje" de "vence amanhã"
  const byUser: Record<string, { today: typeof fixedExpenses; tomorrow: typeof fixedExpenses }> = {}

  for (const fe of fixedExpenses) {
    const effDay = effectiveDueDay(fe.due_date_day, year, monthNum)
    const isToday = effDay === todayDay
    const isTomorrow = effDay === tomorrowDay

    if (!isToday && !isTomorrow) continue

    if (!byUser[fe.user_id]) byUser[fe.user_id] = { today: [], tomorrow: [] }
    if (isToday) byUser[fe.user_id].today.push(fe)
    else byUser[fe.user_id].tomorrow.push(fe)
  }

  const userIds = Object.keys(byUser)
  if (!userIds.length) {
    return NextResponse.json({ sent: 0, reason: 'no due dates match today/tomorrow' })
  }

  // Busca números WhatsApp dos usuários
  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('user_id, whatsapp_number')
    .in('user_id', userIds)

  const phoneByUser: Record<string, string> = {}
  for (const p of prefs ?? []) {
    if (p.whatsapp_number) phoneByUser[p.user_id] = p.whatsapp_number
  }

  // Busca valores confirmados do mês corrente (preferir sobre suggested_amount)
  const feIds = fixedExpenses.map(fe => fe.id)
  const { data: months } = await supabaseAdmin
    .from('fixed_expense_months')
    .select('fixed_expense_id, amount')
    .eq('month', currentMonth)
    .in('fixed_expense_id', feIds)

  const confirmedAmount: Record<string, number> = {}
  for (const m of months ?? []) confirmedAmount[m.fixed_expense_id] = m.amount

  let sentCount = 0
  const errors: string[] = []

  for (const [userId, { today, tomorrow }] of Object.entries(byUser)) {
    const rawPhone = phoneByUser[userId]
    if (!rawPhone) continue

    const phone = normalizePhone(rawPhone)

    const lines: string[] = []

    if (today.length > 0) {
      lines.push('🔴 *Vence HOJE:*')
      for (const fe of today) {
        const amount = confirmedAmount[fe.id] ?? fe.suggested_amount
        const amountStr = amount > 0 ? ` — ${formatAmount(amount)}` : ''
        lines.push(`  • ${fe.description}${amountStr}`)
      }
    }

    if (tomorrow.length > 0) {
      if (lines.length > 0) lines.push('')
      lines.push('⚠️ *Vence amanhã:*')
      for (const fe of tomorrow) {
        const amount = confirmedAmount[fe.id] ?? fe.suggested_amount
        const amountStr = amount > 0 ? ` — ${formatAmount(amount)}` : ''
        lines.push(`  • ${fe.description}${amountStr}`)
      }
    }

    if (!lines.length) continue

    const message = `💳 *30dias — Lembrete de vencimento*\n\n${lines.join('\n')}`

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

  const date = `${currentMonth}-${String(todayDay).padStart(2, '0')}`
  console.log(`[cron-reminders] done sent=${sentCount} errors=${errors.length} date=${date}`)
  return NextResponse.json({ sent: sentCount, errors: errors.length ? errors : undefined, date })
}
