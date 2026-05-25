import { Expense, WeekSummary } from '@/types'

export function getEffectiveAmount(expense: Expense): number {
  if (!expense.sharedWith?.length) return expense.amount
  return expense.amount - expense.sharedWith.reduce((sum, p) => sum + p.amount, 0)
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
