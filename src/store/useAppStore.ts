'use client'

import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Category, Establishment, Expense, FixedExpense, FixedExpenseMonth, UserPreferences, IncomeCategory, IncomeSource, IncomeEntry } from '@/types'
import { DEFAULT_CATEGORIES } from '@/data/categories'
import { DEFAULT_INCOME_CATEGORIES } from '@/data/incomeCategories'
import { getWeekKey, getCurrentWeekKey, getMondaysBetween, getTodayKey, toLocalDateKey } from '@/lib/weekHelpers'
import { nanoid } from 'nanoid'

// ── DB ↔ TypeScript mapping helpers ──────────────────────────────────────────
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
const toSnake = (s: string) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)

function fromDB<T>(row: Record<string, any>): T {
  const result: any = {}
  for (const key of Object.keys(row)) {
    if (key === 'user_id') continue
    const val = row[key]
    result[toCamel(key)] = val === null ? undefined : val
  }
  return result as T
}

function toDB(obj: Record<string, any>, userId: string): Record<string, any> {
  const result: any = { user_id: userId }
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (val !== undefined) result[toSnake(key)] = val
  }
  return result
}

function dbUpdate(data: Record<string, any>): Record<string, any> {
  const result: any = {}
  for (const [k, v] of Object.entries(data)) result[toSnake(k)] = v
  return result
}

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  weeklyBudget: 1000,
  budgetMode: 'fixed',
  categoryBudgets: {},
  currency: 'BRL',
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface AppState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  expenses: Expense[]
  categories: Category[]
  establishments: Establishment[]
  fixedExpenses: FixedExpense[]
  fixedExpenseMonths: FixedExpenseMonth[]
  incomeCategories: IncomeCategory[]
  incomeSources: IncomeSource[]
  incomeEntries: IncomeEntry[]
  preferences: UserPreferences

  // Auth
  initAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<{ error: string | null }>
  signup: (email: string, password: string) => Promise<{ error: string | null }>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  loadUserData: () => Promise<void>

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
  updateFixedExpenseMonth: (id: string, amount: number) => Promise<void>
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

// ── Store ─────────────────────────────────────────────────────────────────────
export const useAppStore = create<AppState>()((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  expenses: [],
  categories: [],
  establishments: [],
  fixedExpenses: [],
  fixedExpenseMonths: [],
  incomeCategories: [],
  incomeSources: [],
  incomeEntries: [],
  preferences: DEFAULT_PREFERENCES,

  // ── Auth ────────────────────────────────────────────────────────────────────
  initAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ user: session.user, isAuthenticated: true })
      await get().loadUserData()
    } else {
      set({ isLoading: false })
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const alreadyLoaded = get().isAuthenticated
        set({ user: session.user, isAuthenticated: true })
        if (!alreadyLoaded) await get().loadUserData()
      } else if (event === 'SIGNED_OUT') {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          expenses: [],
          categories: [],
          establishments: [],
          fixedExpenses: [],
          fixedExpenseMonths: [],
          incomeCategories: [],
          incomeSources: [],
          incomeEntries: [],
          preferences: DEFAULT_PREFERENCES,
        })
      }
    })
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  },

  signup: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  },

  loginWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  },

  logout: async () => {
    await supabase.auth.signOut({ scope: 'global' })
  },

  loadUserData: async () => {
    const { user } = get()
    if (!user) return
    set({ isLoading: true })

    const [catRes, estRes, expRes, feRes, femRes, icatRes, isrcRes, ieRes, prefRes] =
      await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('establishments').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('fixed_expenses').select('*'),
        supabase.from('fixed_expense_months').select('*'),
        supabase.from('income_categories').select('*'),
        supabase.from('income_sources').select('*'),
        supabase.from('income_entries').select('*'),
        supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      ])

    let categories = catRes.data?.map(r => fromDB<Category>(r)) ?? []
    let incomeCategories = icatRes.data?.map(r => fromDB<IncomeCategory>(r)) ?? []

    // Seed defaults for new users
    if (categories.length === 0) {
      await supabase.from('categories').insert(DEFAULT_CATEGORIES.map(c => toDB(c, user.id)))
      categories = DEFAULT_CATEGORIES
    }
    if (incomeCategories.length === 0) {
      await supabase.from('income_categories').insert(DEFAULT_INCOME_CATEGORIES.map(c => toDB(c, user.id)))
      incomeCategories = DEFAULT_INCOME_CATEGORIES
    }

    let preferences = DEFAULT_PREFERENCES
    if (prefRes.data) {
      preferences = fromDB<UserPreferences>(prefRes.data)
    } else {
      await supabase.from('user_preferences').insert(toDB(DEFAULT_PREFERENCES, user.id))
    }

    set({
      categories,
      establishments: estRes.data?.map(r => fromDB<Establishment>(r)) ?? [],
      expenses: expRes.data?.map(r => fromDB<Expense>(r)) ?? [],
      fixedExpenses: feRes.data?.map(r => fromDB<FixedExpense>(r)) ?? [],
      fixedExpenseMonths: femRes.data?.map(r => fromDB<FixedExpenseMonth>(r)) ?? [],
      incomeCategories,
      incomeSources: isrcRes.data?.map(r => fromDB<IncomeSource>(r)) ?? [],
      incomeEntries: ieRes.data?.map(r => fromDB<IncomeEntry>(r)) ?? [],
      preferences,
      isLoading: false,
    })

    get().syncFixedExpenses()
  },

  // ── Expenses ────────────────────────────────────────────────────────────────
  addExpense: (data) => {
    const expense: Expense = { ...data, id: nanoid(), weekKey: getWeekKey(data.date) }
    set(state => ({ expenses: [...state.expenses, expense] }))
    const { user } = get()
    if (user) supabase.from('expenses').insert(toDB(expense, user.id)).then(({ error }) => { if (error) console.error(error) })
  },

  updateExpense: (id, data) => {
    set(state => ({
      expenses: state.expenses.map(e =>
        e.id === id ? { ...e, ...data, weekKey: data.date ? getWeekKey(data.date) : e.weekKey } : e
      ),
    }))
    const { user } = get()
    if (user) {
      const update = dbUpdate(data)
      if (data.date) update.week_key = getWeekKey(data.date)
      supabase.from('expenses').update(update).eq('id', id).then(({ error }) => { if (error) console.error(error) })
    }
  },

  deleteExpense: (id) => {
    set(state => ({ expenses: state.expenses.filter(e => e.id !== id) }))
    const { user } = get()
    if (user) supabase.from('expenses').delete().eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  // ── Categories ──────────────────────────────────────────────────────────────
  addCategory: (data) => {
    const category: Category = { ...data, id: nanoid() }
    set(state => ({ categories: [...state.categories, category] }))
    const { user } = get()
    if (user) supabase.from('categories').insert(toDB(category, user.id)).then(({ error }) => { if (error) console.error(error) })
  },

  updateCategory: (id, data) => {
    set(state => ({ categories: state.categories.map(c => c.id === id ? { ...c, ...data } : c) }))
    const { user } = get()
    if (user) supabase.from('categories').update(dbUpdate(data)).eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  deleteCategory: (id) => {
    set(state => ({ categories: state.categories.filter(c => c.id !== id) }))
    const { user } = get()
    if (user) supabase.from('categories').delete().eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  // ── Establishments ──────────────────────────────────────────────────────────
  addEstablishment: (data) => {
    const establishment: Establishment = { ...data, id: nanoid() }
    set(state => ({ establishments: [...state.establishments, establishment] }))
    const { user } = get()
    if (user) supabase.from('establishments').insert(toDB(establishment, user.id)).then(({ error }) => { if (error) console.error(error) })
  },

  updateEstablishment: (id, data) => {
    set(state => ({ establishments: state.establishments.map(e => e.id === id ? { ...e, ...data } : e) }))
    const { user } = get()
    if (user) supabase.from('establishments').update(dbUpdate(data)).eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  deleteEstablishment: (id) => {
    set(state => ({ establishments: state.establishments.filter(e => e.id !== id) }))
    const { user } = get()
    if (user) supabase.from('establishments').delete().eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  // ── Fixed Expenses ──────────────────────────────────────────────────────────
  addFixedExpense: (data) => {
    const fe: FixedExpense = { ...data, id: nanoid(), createdAt: getTodayKey() }
    set(state => ({ fixedExpenses: [...state.fixedExpenses, fe] }))
    const { user } = get()
    if (user) supabase.from('fixed_expenses').insert(toDB(fe, user.id)).then(({ error }) => { if (error) console.error(error) })
  },

  updateFixedExpense: (id, data) => {
    set(state => ({ fixedExpenses: state.fixedExpenses.map(fe => fe.id === id ? { ...fe, ...data } : fe) }))
    const { user } = get()
    if (user) supabase.from('fixed_expenses').update(dbUpdate(data)).eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  deleteFixedExpense: (id) => {
    set(state => ({
      fixedExpenses: state.fixedExpenses.filter(fe => fe.id !== id),
      fixedExpenseMonths: state.fixedExpenseMonths.filter(fem => fem.fixedExpenseId !== id),
      expenses: state.expenses.filter(e => e.fixedExpenseId !== id),
    }))
    const { user } = get()
    if (user) {
      Promise.all([
        supabase.from('fixed_expenses').delete().eq('id', id),
        supabase.from('fixed_expense_months').delete().eq('fixed_expense_id', id),
        supabase.from('expenses').delete().eq('fixed_expense_id', id),
      ]).then(results => results.forEach(({ error }) => { if (error) console.error(error) }))
    }
  },

  // ── Fixed Expense Months ────────────────────────────────────────────────────
  addFixedExpenseMonth: (data) => {
    const fem: FixedExpenseMonth = { ...data, id: nanoid() }
    set(state => ({ fixedExpenseMonths: [...state.fixedExpenseMonths, fem] }))
    const { user } = get()
    if (user) supabase.from('fixed_expense_months').insert(toDB(fem, user.id)).then(({ error }) => { if (error) console.error(error) })
    get().syncFixedExpenses()
  },

  updateFixedExpenseMonth: async (id, amount) => {
    set(state => ({
      fixedExpenseMonths: state.fixedExpenseMonths.map(fem => fem.id === id ? { ...fem, amount } : fem),
      expenses: state.expenses.filter(e => e.fixedExpenseMonthId !== id),
    }))
    const { user } = get()
    if (user) {
      const results = await Promise.all([
        supabase.from('fixed_expense_months').update({ amount }).eq('id', id),
        supabase.from('expenses').delete().eq('fixed_expense_month_id', id),
      ])
      results.forEach(({ error }) => { if (error) console.error(error) })
    }
    get().syncFixedExpenses()
  },

  deleteFixedExpenseMonth: (id) => {
    set(state => ({
      fixedExpenseMonths: state.fixedExpenseMonths.filter(fem => fem.id !== id),
      expenses: state.expenses.filter(e => e.fixedExpenseMonthId !== id),
    }))
    const { user } = get()
    if (user) {
      Promise.all([
        supabase.from('fixed_expense_months').delete().eq('id', id),
        supabase.from('expenses').delete().eq('fixed_expense_month_id', id),
      ]).then(results => results.forEach(({ error }) => { if (error) console.error(error) }))
    }
  },

  syncFixedExpenses: () => {
    const { fixedExpenses, fixedExpenseMonths, expenses, user } = get()
    const newEntries: Expense[] = []

    for (const fem of fixedExpenseMonths) {
      const fe = fixedExpenses.find(fe => fe.id === fem.fixedExpenseId)
      if (!fe || !fe.isActive) continue

      const [year, month] = fem.month.split('-').map(Number)
      const monthStart = new Date(year, month - 1, 1)
      const monthEnd = new Date(year, month, 0)
      const mondays = getMondaysBetween(monthStart, monthEnd)
      const weeklyAmount = Math.round((fem.amount / 4) * 100) / 100

      for (const monday of mondays) {
        const dateStr = toLocalDateKey(monday)
        const weekKey = getWeekKey(monday)
        const exists = expenses.some(e => e.fixedExpenseMonthId === fem.id && e.weekKey === weekKey)
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
      set(state => ({ expenses: [...state.expenses, ...newEntries] }))
      if (user) {
        supabase.from('expenses').insert(newEntries.map(e => toDB(e, user.id)))
          .then(({ error }) => { if (error) console.error(error) })
      }
    }
  },

  // ── Income Categories ───────────────────────────────────────────────────────
  addIncomeCategory: (data) => {
    const ic: IncomeCategory = { ...data, id: nanoid() }
    set(state => ({ incomeCategories: [...state.incomeCategories, ic] }))
    const { user } = get()
    if (user) supabase.from('income_categories').insert(toDB(ic, user.id)).then(({ error }) => { if (error) console.error(error) })
  },

  updateIncomeCategory: (id, data) => {
    set(state => ({ incomeCategories: state.incomeCategories.map(c => c.id === id ? { ...c, ...data } : c) }))
    const { user } = get()
    if (user) supabase.from('income_categories').update(dbUpdate(data)).eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  deleteIncomeCategory: (id) => {
    set(state => ({ incomeCategories: state.incomeCategories.filter(c => c.id !== id) }))
    const { user } = get()
    if (user) supabase.from('income_categories').delete().eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  // ── Income Sources ──────────────────────────────────────────────────────────
  addIncomeSource: (data) => {
    const src: IncomeSource = { ...data, id: nanoid(), createdAt: getTodayKey() }
    set(state => ({ incomeSources: [...state.incomeSources, src] }))
    const { user } = get()
    if (user) supabase.from('income_sources').insert(toDB(src, user.id)).then(({ error }) => { if (error) console.error(error) })
  },

  updateIncomeSource: (id, data) => {
    set(state => ({ incomeSources: state.incomeSources.map(s => s.id === id ? { ...s, ...data } : s) }))
    const { user } = get()
    if (user) supabase.from('income_sources').update(dbUpdate(data)).eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  deleteIncomeSource: (id) => {
    set(state => ({
      incomeSources: state.incomeSources.filter(s => s.id !== id),
      incomeEntries: state.incomeEntries.filter(e => e.incomeSourceId !== id),
    }))
    const { user } = get()
    if (user) {
      Promise.all([
        supabase.from('income_sources').delete().eq('id', id),
        supabase.from('income_entries').delete().eq('income_source_id', id),
      ]).then(results => results.forEach(({ error }) => { if (error) console.error(error) }))
    }
  },

  // ── Income Entries ──────────────────────────────────────────────────────────
  addIncomeEntry: (data) => {
    const entry: IncomeEntry = { ...data, id: nanoid() }
    set(state => ({ incomeEntries: [...state.incomeEntries, entry] }))
    const { user } = get()
    if (user) supabase.from('income_entries').insert(toDB(entry, user.id)).then(({ error }) => { if (error) console.error(error) })
  },

  updateIncomeEntry: (id, data) => {
    set(state => ({ incomeEntries: state.incomeEntries.map(e => e.id === id ? { ...e, ...data } : e) }))
    const { user } = get()
    if (user) supabase.from('income_entries').update(dbUpdate(data)).eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  deleteIncomeEntry: (id) => {
    set(state => ({ incomeEntries: state.incomeEntries.filter(e => e.id !== id) }))
    const { user } = get()
    if (user) supabase.from('income_entries').delete().eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  // ── Helpers ─────────────────────────────────────────────────────────────────
  getMonthlyBalance: (month) => {
    const { incomeEntries, expenses } = get()
    const income = incomeEntries.filter(e => e.month === month).reduce((sum, e) => sum + e.amount, 0)
    const monthExpenses = expenses.filter(e => e.date.startsWith(month)).reduce((sum, e) => sum + e.amount, 0)
    return { income, expenses: monthExpenses, balance: income - monthExpenses }
  },

  // ── Preferences ─────────────────────────────────────────────────────────────
  setTheme: (theme) => {
    set(state => ({ preferences: { ...state.preferences, theme } }))
    const { user } = get()
    if (user) supabase.from('user_preferences').update({ theme }).eq('user_id', user.id).then(({ error }) => { if (error) console.error(error) })
  },

  setWeeklyBudget: (weeklyBudget) => {
    set(state => ({ preferences: { ...state.preferences, weeklyBudget } }))
    const { user } = get()
    if (user) supabase.from('user_preferences').update({ weekly_budget: weeklyBudget }).eq('user_id', user.id).then(({ error }) => { if (error) console.error(error) })
  },

  setBudgetMode: (budgetMode) => {
    set(state => ({ preferences: { ...state.preferences, budgetMode } }))
    const { user } = get()
    if (user) supabase.from('user_preferences').update({ budget_mode: budgetMode }).eq('user_id', user.id).then(({ error }) => { if (error) console.error(error) })
  },

  setCategoryBudget: (categoryId, amount) => {
    set(state => ({
      preferences: {
        ...state.preferences,
        categoryBudgets: { ...state.preferences.categoryBudgets, [categoryId]: amount },
      },
    }))
    const { user, preferences } = get()
    if (user) supabase.from('user_preferences').update({ category_budgets: preferences.categoryBudgets }).eq('user_id', user.id).then(({ error }) => { if (error) console.error(error) })
  },
}))

export { getCurrentWeekKey }
