import { Expense } from '@/types'
import { getWeekKey, toLocalDateKey } from '@/lib/weekHelpers'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toLocalDateKey(d)
}

export function generateSeedExpenses(): Expense[] {
  const expenses: Expense[] = [
    { id: 's1', amount: 45.90, categoryId: 'food', description: 'Almoço restaurante', date: daysAgo(0), notes: '', weekKey: getWeekKey(daysAgo(0)), paymentMethod: 'credit_card' },
    { id: 's2', amount: 12.50, categoryId: 'transport', description: 'Uber para o trabalho', date: daysAgo(0), notes: '', weekKey: getWeekKey(daysAgo(0)), paymentMethod: 'pix' },
    { id: 's3', amount: 89.00, categoryId: 'shopping', description: 'Roupa na Zara', date: daysAgo(1), notes: '', weekKey: getWeekKey(daysAgo(1)), paymentMethod: 'credit_card' },
    { id: 's4', amount: 32.00, categoryId: 'food', description: 'Supermercado', date: daysAgo(1), notes: '', weekKey: getWeekKey(daysAgo(1)), paymentMethod: 'cash' },
    { id: 's5', amount: 150.00, categoryId: 'bills', description: 'Conta de luz', date: daysAgo(2), notes: '', weekKey: getWeekKey(daysAgo(2)), paymentMethod: 'ted' },
    { id: 's6', amount: 25.00, categoryId: 'leisure', description: 'Cinema', date: daysAgo(2), notes: '', weekKey: getWeekKey(daysAgo(2)), paymentMethod: 'pix' },
    { id: 's7', amount: 60.00, categoryId: 'health', description: 'Farmácia', date: daysAgo(3), notes: '', weekKey: getWeekKey(daysAgo(3)), paymentMethod: 'cash' },
    { id: 's8', amount: 200.00, categoryId: 'education', description: 'Curso online', date: daysAgo(4), notes: '', weekKey: getWeekKey(daysAgo(4)), paymentMethod: 'credit_card' },
    { id: 's9', amount: 18.00, categoryId: 'food', description: 'Café da manhã', date: daysAgo(5), notes: '', weekKey: getWeekKey(daysAgo(5)), paymentMethod: 'pix' },
    { id: 's10', amount: 55.00, categoryId: 'transport', description: 'Gasolina', date: daysAgo(6), notes: '', weekKey: getWeekKey(daysAgo(6)), paymentMethod: 'cash' },
  ]
  return expenses
}
