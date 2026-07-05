import { CreditCard, Expense, WeekSummary } from '@/types'

export function getEffectiveAmount(expense: Expense): number {
  if (!expense.sharedWith?.length) return expense.amount
  return expense.amount - expense.sharedWith.reduce((sum, p) => sum + p.amount, 0)
}

export function isInstallment(expense: Expense): boolean {
  return (expense.installmentTotal ?? 1) > 1
}

// Avança baseDate por `months` meses, fixando o dia no `dueDayOfMonth`.
// Lida com meses curtos (ex: dia 31 em fevereiro → dia 28/29).
export function addMonthsToDate(baseDate: string, months: number, dueDayOfMonth: number): string {
  const d = new Date(baseDate + 'T12:00:00')
  d.setMonth(d.getMonth() + months)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(dueDayOfMonth, lastDay))
  return toLocalDateKey(d)
}

// Mês (YYYY-MM) em que a fatura do cartão vence, dado o dia da compra e o
// fechamento/vencimento do cartão. O vencimento é sempre cronologicamente
// depois do fechamento — se dueDay < closingDay numericamente, o vencimento
// cai no mês seguinte ao fechamento.
export function getInvoiceMonth(purchaseDate: string, card: Pick<CreditCard, 'closingDay' | 'dueDay'>): string {
  const d = new Date(purchaseDate + 'T12:00:00')
  const purchaseDay = d.getDate()

  const closeMonthDate = new Date(d.getFullYear(), d.getMonth(), 1)
  if (purchaseDay > card.closingDay) {
    closeMonthDate.setMonth(closeMonthDate.getMonth() + 1)
  }

  const dueMonthDate = new Date(closeMonthDate)
  if (card.dueDay < card.closingDay) {
    dueMonthDate.setMonth(dueMonthDate.getMonth() + 1)
  }

  return `${dueMonthDate.getFullYear()}-${String(dueMonthDate.getMonth() + 1).padStart(2, '0')}`
}

// Mês efetivo de uma despesa para fins de saldo/caixa: despesas não-cartão
// usam a data da compra; despesas de cartão usam o mês de vencimento da
// fatura. Despesas de cartão antigas sem creditCardId (pré-migração) caem
// no fallback "compra + 1 mês".
export function getEffectiveMonth(expense: Expense, creditCards: CreditCard[]): string {
  if (expense.paymentMethod !== 'credit_card') return expense.date.slice(0, 7)

  const card = creditCards.find(c => c.id === expense.creditCardId)
  if (!card) {
    const [year, month] = expense.date.slice(0, 7).split('-').map(Number)
    const d = new Date(year, month, 1) // month is 1-based here, so this is already +1
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  return getInvoiceMonth(expense.date, card)
}

// Returns ISO week number for a given date
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function getWeekKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date
  const week = getISOWeek(d)
  const year = d.getFullYear()
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function getCurrentWeekKey(): string {
  return getWeekKey(new Date())
}

// Returns Monday of the week for a given weekKey
export function getWeekStart(weekKey: string): Date {
  const [year, weekPart] = weekKey.split('-W')
  const week = parseInt(weekPart, 10)
  const jan4 = new Date(parseInt(year, 10), 0, 4)
  const startOfWeek = new Date(jan4)
  startOfWeek.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1 + (week - 1) * 7)
  return startOfWeek
}

export function getWeekDays(weekKey: string): Date[] {
  const monday = getWeekStart(weekKey)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function formatWeekLabel(weekKey: string): string {
  const days = getWeekDays(weekKey)
  const start = days[0]
  const end = days[6]
  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function groupExpensesByWeek(expenses: Expense[]): Record<string, Expense[]> {
  return expenses.reduce<Record<string, Expense[]>>((acc, expense) => {
    if (!acc[expense.weekKey]) acc[expense.weekKey] = []
    acc[expense.weekKey].push(expense)
    return acc
  }, {})
}

export function buildWeekSummary(
  weekKey: string,
  expenses: Expense[],
  budget: number
): WeekSummary {
  const weekExpenses = expenses.filter((e) => e.weekKey === weekKey)
  const totalAmount = weekExpenses.reduce((sum, e) => sum + getEffectiveAmount(e), 0)

  const byCategory = weekExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.categoryId] = (acc[e.categoryId] || 0) + getEffectiveAmount(e)
    return acc
  }, {})

  const byDay = weekExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.date] = (acc[e.date] || 0) + getEffectiveAmount(e)
    return acc
  }, {})

  return { weekKey, totalAmount, budget, expenses: weekExpenses, byCategory, byDay }
}

export function formatCurrency(amount: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount)
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', weekday: 'short' })
}

// Uses local time — avoids UTC offset shifting the date to the next/previous day
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getTodayKey(): string {
  return toLocalDateKey(new Date())
}

// Returns all Mondays between from (inclusive) and to (inclusive)
export function getMondaysBetween(from: Date, to: Date): Date[] {
  const mondays: Date[] = []
  const d = new Date(from)
  const dow = d.getDay()
  d.setDate(d.getDate() + (dow === 1 ? 0 : (8 - dow) % 7))
  while (d <= to) {
    mondays.push(new Date(d))
    d.setDate(d.getDate() + 7)
  }
  return mondays
}

export function getPreviousWeekKey(weekKey: string): string {
  const monday = getWeekStart(weekKey)
  monday.setDate(monday.getDate() - 7)
  return getWeekKey(monday)
}

export function getNextWeekKey(weekKey: string): string {
  const monday = getWeekStart(weekKey)
  monday.setDate(monday.getDate() + 7)
  return getWeekKey(monday)
}

// Returns the number of full weeks from current week until the last week of deadline month (YYYY-MM).
// Minimum 1 to avoid division by zero.
export function getWeekOfMonth(weekKey: string): { current: number; total: number } {
  const monday = getWeekStart(weekKey)
  const year = monday.getFullYear()
  const month = monday.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const mondays = getMondaysBetween(firstDay, lastDay)
  const mondayKey = toLocalDateKey(monday)
  const idx = mondays.findIndex(m => toLocalDateKey(m) === mondayKey)
  return { current: idx >= 0 ? idx + 1 : 1, total: mondays.length }
}

export function getWeeksUntilDeadline(deadline: string): number {
  const [year, month] = deadline.split('-').map(Number)
  // Last day of deadline month
  const lastDay = new Date(year, month, 0)
  const deadlineWeekKey = getWeekKey(lastDay)
  const deadlineMonday = getWeekStart(deadlineWeekKey)
  const currentMonday = getWeekStart(getCurrentWeekKey())
  const diffMs = deadlineMonday.getTime() - currentMonday.getTime()
  const weeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
  return Math.max(1, weeks)
}
