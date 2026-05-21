'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Category, Establishment, Expense, FixedExpense, FixedExpenseMonth, UserPreferences, IncomeCategory, IncomeSource, IncomeEntry } from '@/types'
import { DEFAULT_CATEGORIES } from '@/data/categories'
import { DEFAULT_INCOME_CATEGORIES } from '@/data/incomeCategories'
import { generateSeedExpenses } from '@/data/seedExpenses'
import { getCurrentWeekKey, getWeekKey, getMondaysBetween, getTodayKey, toLocalDateKey } from '@/lib/weekHelpers'
import { nanoid } from 'nanoid'

interface AppState {
  expenses: Expense[]
  categories: Category[]
  establishments: Establishment[]
  fixedExpenses: FixedExpense[]
  fixedExpenseMonths: FixedExpenseMonth[]
  incomeCategories: IncomeCategory[]
  incomeSources: IncomeSource[]
  incomeEntries: IncomeEntry[]
  preferences: UserPreferences
  isAuthenticated: boolean

  // Auth
  login: () => void
  logout: () => void

  // Expenses
  addExpense: (data: Omit<Expense, 'id' | 'weekKey'>) => void
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id' | 'weekKey'>>) => void
  deleteExpense: (id: string) => void

  // Categories
  addCategory: (data: Omit<Category, 'id'>) => void
  updateCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => void
  deleteCategory: (id: string) => void

  // Establishments
  addEstablishment: (data: Omit<Establishment, 'id'>) => void
  updateEstablishment: (id: string, data: Partial<Omit<Establishment, 'id'>>) => void
  deleteEstablishment: (id: string) => void

  // Fixed Expenses
  addFixedExpense: (data: Omit<FixedExpense, 'id' | 'createdAt'>) => void
  updateFixedExpense: (id: string, data: Partial<Omit<FixedExpense, 'id' | 'createdAt'>>) => void
  deleteFixedExpense: (id: string) => void

  // Fixed Expense Months
  addFixedExpenseMonth: (data: Omit<FixedExpenseMonth, 'id'>) => void
  updateFixedExpenseMonth: (id: string, amount: number) => void
  deleteFixedExpenseMonth: (id: string) => void

  syncFixedExpenses: () => void

  // Income Categories
  addIncomeCategory: (data: Omit<IncomeCategory, 'id'>) => void
  updateIncomeCategory: (id: string, data: Partial<Omit<IncomeCategory, 'id'>>) => void
  deleteIncomeCategory: (id: string) => void

  // Income Sources
  addIncomeSource: (data: Omit<IncomeSource, 'id' | 'createdAt'>) => void
  updateIncomeSource: (id: string, data: Partial<Omit<IncomeSource, 'id' | 'createdAt'>>) => void
  deleteIncomeSource: (id: string) => void

  // Income Entries
  addIncomeEntry: (data: Omit<IncomeEntry, 'id'>) => void
  updateIncomeEntry: (id: string, data: Partial<Omit<IncomeEntry, 'id'>>) => void
  deleteIncomeEntry: (id: string) => void

  // Helpers
  getMonthlyBalance: (month: string) => { income: number; expenses: number; balance: number }

  // Preferences
  setTheme: (theme: UserPreferences['theme']) => void
  setWeeklyBudget: (budget: number) => void
  setBudgetMode: (mode: UserPreferences['budgetMode']) => void
  setCategoryBudget: (categoryId: string, amount: number) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      expenses: generateSeedExpenses(),
      categories: DEFAULT_CATEGORIES,
      establishments: [],
      fixedExpenses: [],
      fixedExpenseMonths: [],
      incomeCategories: DEFAULT_INCOME_CATEGORIES,
      incomeSources: [],
      incomeEntries: [],
      preferences: {
        theme: 'dark',
        weeklyBudget: 1000,
        budgetMode: 'fixed',
        categoryBudgets: {},
        currency: 'BRL',
      },
      isAuthenticated: false,

      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),

      addExpense: (data) =>
        set((state) => ({
          expenses: [
            ...state.expenses,
            {
              ...data,
              id: nanoid(),
              weekKey: getWeekKey(data.date),
            },
          ],
        })),

      updateExpense: (id, data) =>
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id
              ? { ...e, ...data, weekKey: data.date ? getWeekKey(data.date) : e.weekKey }
              : e
          ),
        })),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

      addCategory: (data) =>
        set((state) => ({
          categories: [...state.categories, { ...data, id: nanoid() }],
        })),

      updateCategory: (id, data) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      addEstablishment: (data) =>
        set((state) => ({
          establishments: [...state.establishments, { ...data, id: nanoid() }],
        })),

      updateEstablishment: (id, data) =>
        set((state) => ({
          establishments: state.establishments.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        })),

      deleteEstablishment: (id) =>
        set((state) => ({
          establishments: state.establishments.filter((e) => e.id !== id),
        })),

      addFixedExpense: (data) =>
        set((state) => ({
          fixedExpenses: [
            ...state.fixedExpenses,
            { ...data, id: nanoid(), createdAt: getTodayKey() },
          ],
        })),

      updateFixedExpense: (id, data) =>
        set((state) => ({
          fixedExpenses: state.fixedExpenses.map((fe) =>
            fe.id === id ? { ...fe, ...data } : fe
          ),
        })),

      deleteFixedExpense: (id) =>
        set((state) => ({
          fixedExpenses: state.fixedExpenses.filter((fe) => fe.id !== id),
          fixedExpenseMonths: state.fixedExpenseMonths.filter((fem) => fem.fixedExpenseId !== id),
          expenses: state.expenses.filter((e) => e.fixedExpenseId !== id),
        })),

      addFixedExpenseMonth: (data) => {
        const id = nanoid()
        set((state) => ({
          fixedExpenseMonths: [...state.fixedExpenseMonths, { ...data, id }],
        }))
        get().syncFixedExpenses()
      },

      updateFixedExpenseMonth: (id, amount) => {
        // Remove generated entries for this month so they're regenerated with new amount
        set((state) => ({
          fixedExpenseMonths: state.fixedExpenseMonths.map((fem) =>
            fem.id === id ? { ...fem, amount } : fem
          ),
          expenses: state.expenses.filter((e) => e.fixedExpenseMonthId !== id),
        }))
        get().syncFixedExpenses()
      },

      deleteFixedExpenseMonth: (id) =>
        set((state) => ({
          fixedExpenseMonths: state.fixedExpenseMonths.filter((fem) => fem.id !== id),
          expenses: state.expenses.filter((e) => e.fixedExpenseMonthId !== id),
        })),

      syncFixedExpenses: () => {
        const { fixedExpenses, fixedExpenseMonths, expenses } = get()
        const today = new Date()
        const newEntries: Expense[] = []

        for (const fem of fixedExpenseMonths) {
          const fe = fixedExpenses.find((fe) => fe.id === fem.fixedExpenseId)
          if (!fe || !fe.isActive) continue

          const [year, month] = fem.month.split('-').map(Number)
          const monthStart = new Date(year, month - 1, 1)
          const monthEnd = new Date(year, month, 0) // last day of month
          const to = monthEnd < today ? monthEnd : today
          const mondays = getMondaysBetween(monthStart, to)
          const weeklyAmount = Math.round((fem.amount / 4) * 100) / 100

          for (const monday of mondays) {
            const dateStr = toLocalDateKey(monday)
            const weekKey = getWeekKey(monday)
            const exists = expenses.some((e) => e.fixedExpenseMonthId === fem.id && e.weekKey === weekKey)
            if (!exists) {
              newEntries.push({
                id: nanoid(),
                amount: weeklyAmount,
                categoryId: fe.categoryId,
                description: fe.description,
                date: dateStr,
                weekKey,
                paymentMethod: fe.paymentMethod,
                establishmentId: fe.establishmentId,
                notes: fe.notes,
                fixedExpenseId: fe.id,
                fixedExpenseMonthId: fem.id,
              })
            }
          }
        }

        if (newEntries.length > 0) {
          set((state) => ({ expenses: [...state.expenses, ...newEntries] }))
        }
      },

      addIncomeCategory: (data) =>
        set((state) => ({
          incomeCategories: [...state.incomeCategories, { ...data, id: nanoid() }],
        })),

      updateIncomeCategory: (id, data) =>
        set((state) => ({
          incomeCategories: state.incomeCategories.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),

      deleteIncomeCategory: (id) =>
        set((state) => ({
          incomeCategories: state.incomeCategories.filter((c) => c.id !== id),
        })),

      addIncomeSource: (data) =>
        set((state) => ({
          incomeSources: [
            ...state.incomeSources,
            { ...data, id: nanoid(), createdAt: getTodayKey() },
          ],
        })),

      updateIncomeSource: (id, data) =>
        set((state) => ({
          incomeSources: state.incomeSources.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),

      deleteIncomeSource: (id) =>
        set((state) => ({
          incomeSources: state.incomeSources.filter((s) => s.id !== id),
          incomeEntries: state.incomeEntries.filter((e) => e.incomeSourceId !== id),
        })),

      addIncomeEntry: (data) =>
        set((state) => ({
          incomeEntries: [...state.incomeEntries, { ...data, id: nanoid() }],
        })),

      updateIncomeEntry: (id, data) =>
        set((state) => ({
          incomeEntries: state.incomeEntries.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        })),

      deleteIncomeEntry: (id) =>
        set((state) => ({
          incomeEntries: state.incomeEntries.filter((e) => e.id !== id),
        })),

      getMonthlyBalance: (month) => {
        const { incomeEntries, expenses } = get()
        const income = incomeEntries
          .filter((e) => e.month === month)
          .reduce((sum, e) => sum + e.amount, 0)
        const monthExpenses = expenses
          .filter((e) => e.date.startsWith(month))
          .reduce((sum, e) => sum + e.amount, 0)
        return { income, expenses: monthExpenses, balance: income - monthExpenses }
      },

      setTheme: (theme) =>
        set((state) => ({
          preferences: { ...state.preferences, theme },
        })),

      setWeeklyBudget: (weeklyBudget) =>
        set((state) => ({
          preferences: { ...state.preferences, weeklyBudget },
        })),

      setBudgetMode: (budgetMode) =>
        set((state) => ({
          preferences: { ...state.preferences, budgetMode },
        })),

      setCategoryBudget: (categoryId, amount) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            categoryBudgets: { ...state.preferences.categoryBudgets, [categoryId]: amount },
          },
        })),
    }),
    {
      name: '7dias-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.syncFixedExpenses()
      },
    }
  )
)

export { getCurrentWeekKey }
