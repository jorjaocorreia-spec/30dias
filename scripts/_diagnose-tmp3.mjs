import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('d:/30Dias/.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)] })
)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const { data: usersPage } = await admin.auth.admin.listUsers()
const user = usersPage.users.find(u => u.email === 'jorjaocorreia@gmail.com')

const { data: expenses } = await admin
  .from('expenses')
  .select('*')
  .eq('user_id', user.id)
  .gte('date', '2026-05-01')
  .lte('date', '2026-08-31')
  .order('date')

const { data: cards } = await admin.from('credit_cards').select('*').eq('user_id', user.id)

function getInvoiceMonth(purchaseDate, card) {
  const d = new Date(purchaseDate + 'T12:00:00')
  const purchaseDay = d.getDate()
  const closeMonthDate = new Date(d.getFullYear(), d.getMonth(), 1)
  if (purchaseDay > card.closing_day) closeMonthDate.setMonth(closeMonthDate.getMonth() + 1)
  const dueMonthDate = new Date(closeMonthDate)
  if (card.due_day < card.closing_day) dueMonthDate.setMonth(dueMonthDate.getMonth() + 1)
  return `${dueMonthDate.getFullYear()}-${String(dueMonthDate.getMonth() + 1).padStart(2, '0')}`
}

function getEffectiveMonth(e, cards) {
  if (e.payment_method !== 'credit_card') return e.date.slice(0, 7)
  const card = cards.find(c => c.id === e.credit_card_id)
  if (!card) {
    const [year, month] = e.date.slice(0, 7).split('-').map(Number)
    const d = new Date(year, month, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  return getInvoiceMonth(e.date, card)
}

function getEffectiveAmount(e) {
  const shared = (e.shared_with ?? []).reduce((s, p) => s + p.amount, 0)
  return e.amount - shared
}

let julyByEffective = []
for (const e of expenses) {
  const eff = getEffectiveMonth(e, cards ?? [])
  if (eff === '2026-07') julyByEffective.push({ ...e, eff })
}

console.log('--- Despesas com mes efetivo = 2026-07 (GASTOS do dashboard) ---')
let totalEff = 0
for (const e of julyByEffective) {
  const amt = getEffectiveAmount(e)
  totalEff += amt
  console.log(`${e.date} | ${e.description} | R$${e.amount} | efetivo=${amt.toFixed(2)} | metodo=${e.payment_method} | cardId=${e.credit_card_id ?? '-'} | fixedId=${e.fixed_expense_id ?? '-'}`)
}
console.log('TOTAL (efetivo):', totalEff.toFixed(2))

console.log('\n--- Detalhe do calculo de invoice month pras 6 despesas de junho ---')
for (const e of expenses.filter(e => e.date.startsWith('2026-06') && e.payment_method === 'credit_card')) {
  const card = cards.find(c => c.id === e.credit_card_id)
  console.log(`${e.date} | ${e.description} | cardId=${e.credit_card_id} | card=${card?.name} closing=${card?.closing_day} due=${card?.due_day} -> invoiceMonth=${card ? getInvoiceMonth(e.date, card) : 'FALLBACK+1'}`)
}
