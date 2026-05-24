import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractExpense } from '@/lib/whatsapp/extractExpense'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage'
import { getWeekKey } from '@/lib/weekHelpers'
import { nanoid } from 'nanoid'

// Evolution API v2 envia eventos de vários tipos — só processa mensagens de texto recebidas
function extractTextMessage(body: any): { phone: string; text: string } | null {
  // Ignora mensagens enviadas pelo próprio bot (fromMe: true)
  if (body?.data?.key?.fromMe) return null

  // Quando addressingMode === 'lid', remoteJid é um ID interno do WhatsApp.
  // O número real fica em remoteJidAlt ("5511999@s.whatsapp.net").
  const addressingMode: string = body?.data?.key?.addressingMode ?? ''
  const rawJid: string =
    addressingMode === 'lid'
      ? (body?.data?.key?.remoteJidAlt ?? body?.data?.key?.remoteJid ?? '')
      : (body?.data?.key?.remoteJid ?? '')

  if (!rawJid) return null

  // Normaliza número: "5511999999999@s.whatsapp.net" → "5511999999999"
  const phone = rawJid.replace(/@.*$/, '').replace(/[^0-9]/g, '')
  if (!phone) return null

  // Suporta mensagens de texto simples e mensagens estendidas
  const text: string =
    body?.data?.message?.conversation ??
    body?.data?.message?.extendedTextMessage?.text ??
    ''

  if (!text.trim()) return null

  return { phone, text: text.trim() }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Valida o webhook secret para rejeitar chamadas não autorizadas
  const secret = req.headers.get('x-webhook-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Só processa eventos de mensagem recebida
  const event: string = body?.event ?? ''
  if (event !== 'messages.upsert') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const msg = extractTextMessage(body)
  if (!msg) return NextResponse.json({ ok: true, skipped: true })

  const { phone, text } = msg

  // Busca o usuário pelo número de WhatsApp cadastrado.
  // Tenta formato completo (ex: "554598584418") e sem código do país BR (ex: "45998584418")
  // para tolerar divergência entre o que o usuário digita e o que a Evolution API envia.
  const phoneAlt = phone.startsWith('55') && phone.length >= 12 ? phone.slice(2) : null
  const orFilter = phoneAlt
    ? `whatsapp_number.eq.${phone},whatsapp_number.eq.${phoneAlt}`
    : `whatsapp_number.eq.${phone}`

  const { data: prefsRows, error: prefsError } = await supabaseAdmin
    .from('user_preferences')
    .select('user_id')
    .or(orFilter)
    .limit(1)

  const prefs = prefsRows?.[0] ?? null

  if (prefsError || !prefs?.user_id) {
    // Número não autorizado — não responde para não revelar a existência do sistema
    console.warn(`WhatsApp webhook: número não autorizado ${phone}`)
    return NextResponse.json({ ok: true, skipped: true })
  }

  const userId = prefs.user_id

  // Carrega categorias e estabelecimentos do usuário para contexto do Claude
  const [{ data: categories }, { data: establishments }] = await Promise.all([
    supabaseAdmin.from('categories').select('id, name').eq('user_id', userId),
    supabaseAdmin.from('establishments').select('id, name, category_id').eq('user_id', userId),
  ])

  // Extrai entidades da mensagem com Claude
  const result = await extractExpense(
    text,
    categories ?? [],
    (establishments ?? []).map(e => ({ id: e.id, name: e.name, categoryId: e.category_id })),
  )

  if (!result.success) {
    await sendWhatsAppMessage(phone, `❌ ${result.reason}`)
    return NextResponse.json({ ok: true, extracted: false })
  }

  const { expense } = result
  const id = nanoid()
  const weekKey = getWeekKey(expense.date)

  // Insere a despesa no Supabase
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
    console.error('Erro ao inserir despesa:', insertError)
    await sendWhatsAppMessage(phone, '❌ Erro ao salvar a despesa. Tente novamente.')
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 })
  }

  // Formata a confirmação
  const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)
  const dateFormatted = new Date(expense.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const categoryName = categories?.find(c => c.id === expense.categoryId)?.name ?? expense.categoryId

  await sendWhatsAppMessage(phone, `✅ *${amount}* · ${categoryName} · ${dateFormatted}\n_${expense.description}_`)

  return NextResponse.json({ ok: true, expenseId: id })
}
