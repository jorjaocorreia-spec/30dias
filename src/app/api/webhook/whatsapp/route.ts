import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractExpense } from '@/lib/whatsapp/extractExpense'
import { extractIncome } from '@/lib/whatsapp/extractIncome'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage'
import { detectIntent } from '@/lib/whatsapp/detectIntent'
import {
  handleWeekQuery,
  handleMonthQuery,
  handlePendingQuery,
  handleSummaryQuery,
  handleHelp,
} from '@/lib/whatsapp/queryHandlers'
import { getWeekKey } from '@/lib/weekHelpers'
import { nanoid } from 'nanoid'

function extractTextMessage(body: any): { phone: string; text: string } | null {
  const key = body?.data?.key
  console.log('[WA] key:', JSON.stringify(key))

  if (key?.fromMe) {
    console.log('[WA] skip: fromMe')
    return null
  }

  const addressingMode: string = key?.addressingMode ?? ''
  const rawJid: string =
    addressingMode === 'lid'
      ? (key?.remoteJidAlt ?? key?.remoteJid ?? '')
      : (key?.remoteJid ?? '')

  console.log('[WA] addressingMode:', addressingMode, '| rawJid:', rawJid)

  if (!rawJid) {
    console.log('[WA] skip: no rawJid')
    return null
  }

  const phone = rawJid.replace(/@.*$/, '').replace(/[^0-9]/g, '')
  if (!phone) {
    console.log('[WA] skip: no phone after normalize')
    return null
  }

  const message = body?.data?.message
  const text: string =
    message?.conversation ??
    message?.extendedTextMessage?.text ??
    ''

  console.log('[WA] phone:', phone, '| text:', text)

  if (!text.trim()) {
    console.log('[WA] skip: no text — messageType:', body?.data?.messageType, '| messageKeys:', Object.keys(message ?? {}))
    return null
  }

  return { phone, text: text.trim() }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, service: 'whatsapp-webhook' })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-webhook-secret') ?? req.nextUrl.searchParams.get('secret')
  console.log('[WA] secret match:', secret === process.env.WEBHOOK_SECRET, '| received:', secret?.slice(0, 8))

  if (secret !== process.env.WEBHOOK_SECRET) {
    console.log('[WA] unauthorized — expected:', process.env.WEBHOOK_SECRET?.slice(0, 8))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event: string = body?.event ?? ''
  const instance: string = body?.instance ?? ''
  console.log('[WA] event:', event, '| instance:', instance)

  // Evolution API v2 uses 'MESSAGES_UPSERT'; v1 uses 'messages.upsert'
  if (event !== 'messages.upsert' && event !== 'MESSAGES_UPSERT') {
    console.log('[WA] skip: unhandled event:', event)
    return NextResponse.json({ ok: true, skipped: true, event })
  }

  const msg = extractTextMessage(body)
  if (!msg) return NextResponse.json({ ok: true, skipped: true, reason: 'extractTextMessage returned null' })

  const { phone, text } = msg

  // Remove country code 55 to get local number
  const phoneAlt = phone.startsWith('55') && phone.length >= 12 ? phone.slice(2) : null
  // Brazilian mobiles: Evolution may omit the 9th digit (e.g. 4598584418 → 45998584418)
  const phoneAlt9 = phoneAlt && phoneAlt.length === 10 ? phoneAlt.slice(0, 2) + '9' + phoneAlt.slice(2) : null

  const variants = [phone, phoneAlt, phoneAlt9].filter(Boolean) as string[]
  const orFilter = variants.map(v => `whatsapp_number.eq.${v}`).join(',')

  console.log('[WA] looking up phone:', phone, '| alt:', phoneAlt, '| alt9:', phoneAlt9, '| filter:', orFilter)

  const { data: prefsRows, error: prefsError } = await supabaseAdmin
    .from('user_preferences')
    .select('user_id')
    .or(orFilter)
    .limit(1)

  console.log('[WA] prefs lookup result:', JSON.stringify(prefsRows), '| error:', prefsError?.message)

  const prefs = prefsRows?.[0] ?? null

  if (prefsError || !prefs?.user_id) {
    console.warn('[WA] unauthorized phone:', phone, '| alt:', phoneAlt)
    try {
      await sendWhatsAppMessage(phone, '⚠️ Número não cadastrado no *30dias*. Acesse o app e adicione seu WhatsApp em *Integrações > WhatsApp*.')
    } catch (e) {
      console.error('[WA] failed to send not-found message:', e)
    }
    return NextResponse.json({ ok: true, skipped: true, reason: 'phone not found' })
  }

  const userId = prefs.user_id
  console.log('[WA] userId found:', userId)

  // Route queries before attempting expense extraction
  const intent = detectIntent(text)
  console.log('[WA] intent:', intent)

  // Income registration — async like expense, handled separately
  if (intent === 'income') {
    const { data: incomeCategories } = await supabaseAdmin
      .from('income_categories')
      .select('id, name')
      .eq('user_id', userId)

    const result = await extractIncome(text, incomeCategories ?? [])
    console.log('[WA] income extraction result:', JSON.stringify(result))

    if (!result.success) {
      await sendWhatsAppMessage(phone, `❌ ${result.reason}`)
      return NextResponse.json({ ok: true, extracted: false, reason: result.reason })
    }

    const { income } = result
    const incomeId = nanoid()
    const month = income.receivedDate.slice(0, 7)

    const { error: incomeInsertError } = await supabaseAdmin.from('income_entries').insert({
      id: incomeId,
      user_id: userId,
      category_id: income.categoryId,
      description: income.description,
      amount: income.amount,
      month,
      received_date: income.receivedDate,
      payment_method: income.paymentMethod,
      notes: null,
    })

    if (incomeInsertError) {
      console.error('[WA] income insert error:', incomeInsertError)
      await sendWhatsAppMessage(phone, '❌ Erro ao salvar a receita. Tente novamente.')
      return NextResponse.json({ ok: false, error: incomeInsertError.message }, { status: 500 })
    }

    const incomeAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income.amount)
    const incomeDateFmt = new Date(income.receivedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const incomeCategoryName = (incomeCategories ?? []).find(c => c.id === income.categoryId)?.name ?? income.categoryId

    await sendWhatsAppMessage(phone, `✅ *+${incomeAmount}* · ${incomeCategoryName} · ${incomeDateFmt}\n_${income.description}_`)
    console.log('[WA] income saved:', incomeId)
    return NextResponse.json({ ok: true, incomeEntryId: incomeId })
  }

  if (intent !== 'expense') {
    let reply: string
    if (intent === 'help') {
      reply = handleHelp()
    } else if (intent === 'query_week') {
      reply = await handleWeekQuery(userId, supabaseAdmin)
    } else if (intent === 'query_month') {
      reply = await handleMonthQuery(userId, supabaseAdmin)
    } else if (intent === 'query_pending') {
      reply = await handlePendingQuery(userId, supabaseAdmin)
    } else {
      reply = await handleSummaryQuery(userId, supabaseAdmin)
    }
    await sendWhatsAppMessage(phone, reply)
    return NextResponse.json({ ok: true, intent })
  }

  const [{ data: categories }, { data: establishments }] = await Promise.all([
    supabaseAdmin.from('categories').select('id, name').eq('user_id', userId),
    supabaseAdmin.from('establishments').select('id, name, category_id').eq('user_id', userId),
  ])

  const result = await extractExpense(
    text,
    categories ?? [],
    (establishments ?? []).map(e => ({ id: e.id, name: e.name, categoryId: e.category_id })),
  )

  console.log('[WA] extraction result:', JSON.stringify(result))

  if (!result.success) {
    await sendWhatsAppMessage(phone, `❌ ${result.reason}`)
    return NextResponse.json({ ok: true, extracted: false, reason: result.reason })
  }

  const { expense } = result
  const id = nanoid()
  const weekKey = getWeekKey(expense.date)

  const { error: insertError } = await supabaseAdmin.from('expenses').insert({
    id,
    user_id: userId,
    amount: expense.amount,
    description: expense.description,
    category_id: expense.categoryId,
    establishment_id: expense.establishmentId ?? null,
    payment_method: expense.paymentMethod,
    date: expense.date,
    week_key: weekKey,
    notes: null,
  })

  if (insertError) {
    console.error('[WA] insert error:', insertError)
    await sendWhatsAppMessage(phone, '❌ Erro ao salvar a despesa. Tente novamente.')
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 })
  }

  const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)
  const dateFormatted = new Date(expense.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const categoryName = categories?.find(c => c.id === expense.categoryId)?.name ?? expense.categoryId

  await sendWhatsAppMessage(phone, `✅ *${amount}* · ${categoryName} · ${dateFormatted}\n_${expense.description}_`)

  console.log('[WA] expense saved:', id)
  return NextResponse.json({ ok: true, expenseId: id })
}
