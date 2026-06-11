'use client'

import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Category, Establishment, Expense, ExpenseParticipant, FinancialGoal, FixedExpense, FixedExpenseMonth, GoalContribution, UserPreferences, IncomeCategory, IncomeSource, IncomeEntry, MonthlyBudget } from '@/types'
import { DEFAULT_CATEGORIES } from '@/data/categories'
import { DEFAULT_INCOME_CATEGORIES } from '@/data/incomeCategories'
import { getWeekKey, getCurrentWeekKey, getMondaysBetween, getTodayKey, toLocalDateKey, getEffectiveAmount, getWeeksUntilDeadline } from '@/lib/weekHelpers'
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
  monthlyBudget: 4000,
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
  financialGoals: FinancialGoal[]
  goalContributions: GoalContribution[]
  preferences: UserPreferences
  monthlyBudgets: MonthlyBudget[]

  // Auth
  initAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<{ error: string | null }>
  signup: (email: string, password: string) => Promise<{ error: string | null }>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  loadUserData: () => Promise<void>

  // Expenses
  addExpense: (data: Omit<Expense, 'id' | 'weekKey'>) => void
  addExpenses: (items: Omit<Expense, 'id' | 'weekKey'>[]) => void
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
  updateFixedExpenseMonth: (id: string, amount: number, date?: string) => Promise<void>
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

  // Financial Goals
  addFinancialGoal: (data: Omit<FinancialGoal, 'id' | 'createdAt'>) => void
  updateFinancialGoal: (id: string, data: Partial<Omit<FinancialGoal, 'id' | 'createdAt'>>) => void
  deleteFinancialGoal: (id: string) => void

  // Goal Contributions
  addGoalContribution: (data: Omit<GoalContribution, 'id'>) => void
  updateGoalContribution: (id: string, amount: number) => void
  deleteGoalContribution: (id: string) => void

  // Goal Helpers
  getGoalProgress: (goalId: string) => { contributed: number; remaining: number; weeklyNeeded: number; weeksLeft: number; percentage: number; effectiveWeekly: number }
  getGoalWeeklyTotal: (deductOnly?: boolean) => number
  getGoalCategoryContribution: () => Record<string, number>

  // Helpers
  getMonthlyBalance: (month: string) => { income: number; expenses: number; balance: number }
  getFixedWeeklyContribution: (month?: string) => number
  getFixedCategoryContribution: (month?: string) => Record<string, number>
  getFixedMonthlyContribution: (month?: string) => number
  getFixedMonthlyCategoryContribution: (month?: string) => Record<string, number>
  markParticipantAsPaid: (expenseId: string, participantId: string, paid: boolean) => void
  getSharedPendingTotal: (month?: string) => number

  // Preferences
  setTheme: (theme: UserPreferences['theme']) => void
  setMonthlyBudget: (budget: number) => void
  setBudgetMode: (mode: UserPreferences['budgetMode']) => void
  setCategoryBudget: (categoryId: string, amount: number) => void
  setAllCategoryBudgets: (budgets: Record<string, number>) => void
  setWhatsappNumber: (number: string) => Promise<void>
  setAvailableMode: (mode: NonNullable<UserPreferences['availableMode']>) => void
  getBudgetForMonth: (month: string) => { monthlyBudget: number; categoryBudgets: Record<string, number> }
  saveBudgetForMonth: (month: string, data: { monthlyBudget?: number; categoryBudgets?: Record<string, number> }) => Promise<void>
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
  financialGoals: [],
  goalContributions: [],
  preferences: DEFAULT_PREFERENCES,
  monthlyBudgets: [],

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
          financialGoals: [],
          goalContributions: [],
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

    const [catRes, estRes, expRes, feRes, femRes, icatRes, isrcRes, ieRes, prefRes, goalsRes, contribRes, mbRes] =
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
        supabase.from('financial_goals').select('*'),
        supabase.from('goal_contributions').select('*'),
        supabase.from('monthly_budgets').select('*'),
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
      const raw = fromDB<any>(prefRes.data)
      preferences = {
        theme: raw.theme ?? DEFAULT_PREFERENCES.theme,
        // monthlyBudget: use monthly_budget column if available, else migrate from weekly_budget * 4
        monthlyBudget: raw.monthlyBudget ?? (raw.weeklyBudget ? raw.weeklyBudget * 4 : DEFAULT_PREFERENCES.monthlyBudget),
        budgetMode: raw.budgetMode ?? DEFAULT_PREFERENCES.budgetMode,
        categoryBudgets: raw.categoryBudgets ?? {},
        currency: raw.currency ?? DEFAULT_PREFERENCES.currency,
        whatsappNumber: raw.whatsappNumber,
      }
    } else {
      await supabase.from('user_preferences').insert(toDB(DEFAULT_PREFERENCES, user.id))
    }

    // Deduplicate fixed expenses: keep one entry per (fixedExpenseMonthId, weekKey)
    const rawExpenses: Expense[] = expRes.data?.map(r => fromDB<Expense>(r)) ?? []
    const seenFixed = new Set<string>()
    const duplicateIds: string[] = []
    const expenses = rawExpenses.filter(e => {
      if (!e.fixedExpenseMonthId) return true
      const key = `${e.fixedExpenseMonthId}|${e.weekKey}`
      if (seenFixed.has(key)) { duplicateIds.push(e.id); return false }
      seenFixed.add(key)
      return true
    })
    if (duplicateIds.length > 0) {
      supabase.from('expenses').delete().in('id', duplicateIds).then(({ error }) => {
        if (error) console.error('dedup error', error)
        else console.log(`Removed ${duplicateIds.length} duplicate fixed expenses`)
      })
    }

    set({
      categories,
      establishments: estRes.data?.map(r => fromDB<Establishment>(r)) ?? [],
      expenses,
      fixedExpenses: feRes.data?.map(r => fromDB<FixedExpense>(r)) ?? [],
      fixedExpenseMonths: femRes.data?.map(r => fromDB<FixedExpenseMonth>(r)) ?? [],
      incomeCategories,
      incomeSources: isrcRes.data?.map(r => fromDB<IncomeSource>(r)) ?? [],
      incomeEntries: ieRes.data?.map(r => fromDB<IncomeEntry>(r)) ?? [],
      financialGoals: goalsRes.data?.map(r => fromDB<FinancialGoal>(r)) ?? [],
      goalContributions: contribRes.data?.map(r => fromDB<GoalContribution>(r)) ?? [],
      preferences,
      monthlyBudgets: mbRes.data?.map(r => fromDB<MonthlyBudget>(r)) ?? [],
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

  addExpenses: (items) => {
    const { user } = get()
    const expenses = items.map(data => ({ ...data, id: nanoid(), weekKey: getWeekKey(data.date) } as Expense))
    set(state => ({ expenses: [...state.expenses, ...expenses] }))
    if (user) {
      const rows = expenses.map(e => toDB(e, user.id))
      supabase.from('expenses').insert(rows).then(({ error }) => { if (error) console.error(error) })
    }
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
    const expense = get().expenses.find(e => e.id === id)
    const femId = expense?.fixedExpenseMonthId
    set(state => ({
      expenses: state.expenses.filter(e => e.id !== id),
      fixedExpenseMonths: femId
        ? state.fixedExpenseMonths.filter(fem => fem.id !== femId)
        : state.fixedExpenseMonths,
    }))
    const { user } = get()
    if (user) {
      supabase.from('expenses').delete().eq('id', id).then(({ error }) => { if (error) console.error(error) })
      if (femId) supabase.from('fixed_expense_months').delete().eq('id', femId).then(({ error }) => { if (error) console.error(error) })
    }
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
    set(state => {
      const { [id]: _removed, ...remainingBudgets } = state.preferences.categoryBudgets ?? {}
      return {
        categories: state.categories.filter(c => c.id !== id),
        preferences: { ...state.preferences, categoryBudgets: remainingBudgets },
      }
    })
    const { user, preferences } = get()
    if (user) {
      supabase.from('categories').delete().eq('id', id).then(({ error }) => { if (error) console.error(error) })
      supabase.from('user_preferences').update({ category_budgets: preferences.categoryBudgets }).eq('user_id', user.id).then(({ error }) => { if (error) console.error(error) })
    }
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

  updateFixedExpenseMonth: async (id, amount, date?) => {
    const update: Partial<FixedExpenseMonth> = { amount }
    if (date !== undefined) update.date = date
    set(state => ({
      fixedExpenseMonths: state.fixedExpenseMonths.map(fem => fem.id === id ? { ...fem, ...update } : fem),
      expenses: state.expenses.filter(e => e.fixedExpenseMonthId !== id),
    }))
    const { user } = get()
    if (user) {
      const dbFields: Record<string, unknown> = { amount }
      if (date !== undefined) dbFields.date = date
      const results = await Promise.all([
        supabase.from('fixed_expense_months').update(dbFields).eq('id', id),
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

      const alreadyExists = expenses.some(e => e.fixedExpenseMonthId === fem.id)
      if (alreadyExists) continue

      // Data do lançamento: fem.date > dueDateDay do template > 1º do mês
      let dateStr: string
      if (fem.date) {
        dateStr = fem.date
      } else if (fe.dueDateDay) {
        const [year, month] = fem.month.split('-').map(Number)
        const lastDay = new Date(year, month, 0).getDate()
        const day = Math.min(fe.dueDateDay, lastDay)
        dateStr = `${fem.month}-${String(day).padStart(2, '0')}`
      } else {
        dateStr = `${fem.month}-01`
      }

      const weekKey = getWeekKey(dateStr)
      newEntries.push({
        id: nanoid(),
        amount: fem.amount,
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

  // ── Financial Goals ─────────────────────────────────────────────────────────
  addFinancialGoal: (data) => {
    const goal: FinancialGoal = { ...data, id: nanoid(), createdAt: getTodayKey() }
    set(state => ({ financialGoals: [...state.financialGoals, goal] }))
    const { user } = get()
    if (user) supabase.from('financial_goals').insert(toDB(goal, user.id)).then(({ error }) => { if (error) console.error(error) })
  },

  updateFinancialGoal: (id, data) => {
    set(state => ({ financialGoals: state.financialGoals.map(g => g.id === id ? { ...g, ...data } : g) }))
    const { user } = get()
    if (user) supabase.from('financial_goals').update(dbUpdate(data)).eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  deleteFinancialGoal: (id) => {
    set(state => ({
      financialGoals: state.financialGoals.filter(g => g.id !== id),
      goalContributions: state.goalContributions.filter(c => c.goalId !== id),
    }))
    const { user } = get()
    if (user) {
      Promise.all([
        supabase.from('financial_goals').delete().eq('id', id),
        supabase.from('goal_contributions').delete().eq('goal_id', id),
      ]).then(results => results.forEach(({ error }) => { if (error) console.error(error) }))
    }
  },

  // ── Goal Contributions ──────────────────────────────────────────────────────
  addGoalContribution: (data) => {
    const contribution: GoalContribution = { ...data, id: nanoid() }
    set(state => ({ goalContributions: [...state.goalContributions, contribution] }))
    const { user } = get()
    if (user) supabase.from('goal_contributions').insert(toDB(contribution, user.id)).then(({ error }) => { if (error) console.error(error) })
  },

  updateGoalContribution: (id, amount) => {
    set(state => ({ goalContributions: state.goalContributions.map(c => c.id === id ? { ...c, amount } : c) }))
    const { user } = get()
    if (user) supabase.from('goal_contributions').update({ amount }).eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  deleteGoalContribution: (id) => {
    set(state => ({ goalContributions: state.goalContributions.filter(c => c.id !== id) }))
    const { user } = get()
    if (user) supabase.from('goal_contributions').delete().eq('id', id).then(({ error }) => { if (error) console.error(error) })
  },

  // ── Goal Helpers ────────────────────────────────────────────────────────────
  getGoalProgress: (goalId) => {
    const { financialGoals, goalContributions } = get()
    const goal = financialGoals.find(g => g.id === goalId)
    if (!goal) return { contributed: 0, remaining: 0, weeklyNeeded: 0, weeksLeft: 1, percentage: 0, effectiveWeekly: 0 }
    const contributed = goalContributions.filter(c => c.goalId === goalId).reduce((sum, c) => sum + c.amount, 0)
    const remaining = Math.max(0, goal.targetAmount - contributed)
    const weeksLeft = getWeeksUntilDeadline(goal.deadline)
    const weeklyNeeded = remaining > 0 ? Math.ceil((remaining / weeksLeft) * 100) / 100 : 0
    const effectiveWeekly = goal.weeklyAmount ?? weeklyNeeded
    const percentage = goal.targetAmount > 0 ? Math.min(100, Math.round((contributed / goal.targetAmount) * 100)) : 0
    return { contributed, remaining, weeklyNeeded, weeksLeft, percentage, effectiveWeekly }
  },

  getGoalWeeklyTotal: (deductOnly = false) => {
    const { financialGoals } = get()
    return financialGoals
      .filter(g => g.isActive && !g.completedAt && (!deductOnly || g.deductFromBudget))
      .reduce((sum, g) => sum + get().getGoalProgress(g.id).effectiveWeekly, 0)
  },

  getGoalCategoryContribution: () => {
    const { financialGoals } = get()
    const result: Record<string, number> = {}
    financialGoals
      .filter(g => g.isActive && !g.completedAt && g.deductFromBudget)
      .forEach(g => {
        const { effectiveWeekly } = get().getGoalProgress(g.id)
        if (g.icon) result[g.id] = (result[g.id] ?? 0) + effectiveWeekly
      })
    return result
  },

  // ── Helpers ─────────────────────────────────────────────────────────────────
  getMonthlyBalance: (month) => {
    const { incomeEntries, expenses } = get()
    const income = incomeEntries.filter(e => e.month === month).reduce((sum, e) => sum + e.amount, 0)
    const monthExpenses = expenses.filter(e => e.date.startsWith(month)).reduce((sum, e) => sum + getEffectiveAmount(e), 0)
    return { income, expenses: monthExpenses, balance: income - monthExpenses }
  },

  getFixedWeeklyContribution: (month) => {
    const m = month ?? new Date().toISOString().slice(0, 7)
    const [year, mon] = m.split('-').map(Number)
    const weeks = getMondaysBetween(new Date(year, mon - 1, 1), new Date(year, mon, 0)).length || 1
    const monthly = get().getFixedMonthlyContribution(m)
    return Math.round((monthly / weeks) * 100) / 100
  },

  getFixedCategoryContribution: (month) => {
    const m = month ?? new Date().toISOString().slice(0, 7)
    const [year, mon] = m.split('-').map(Number)
    const weeks = getMondaysBetween(new Date(year, mon - 1, 1), new Date(year, mon, 0)).length || 1
    const byCategory = get().getFixedMonthlyCategoryContribution(m)
    const result: Record<string, number> = {}
    for (const [catId, monthly] of Object.entries(byCategory)) {
      result[catId] = Math.round((monthly / weeks) * 100) / 100
    }
    return result
  },

  getFixedMonthlyContribution: (_month?: string) => {
    const { fixedExpenses } = get()
    return fixedExpenses
      .filter(fe => fe.isActive)
      .reduce((sum, fe) => sum + fe.suggestedAmount, 0)
  },

  getFixedMonthlyCategoryContribution: (_month?: string) => {
    const { fixedExpenses } = get()
    const result: Record<string, number> = {}
    fixedExpenses
      .filter(fe => fe.isActive)
      .forEach(fe => {
        result[fe.categoryId] = (result[fe.categoryId] ?? 0) + fe.suggestedAmount
      })
    return result
  },

  markParticipantAsPaid: (expenseId, participantId, paid) => {
    const expense = get().expenses.find(e => e.id === expenseId)
    if (!expense?.sharedWith) return
    const paidAt = paid ? getTodayKey() : undefined
    const updated: ExpenseParticipant[] = expense.sharedWith.map(p =>
      p.id === participantId ? { ...p, paid, paidAt } : p
    )
    get().updateExpense(expenseId, { sharedWith: updated })
  },

  getSharedPendingTotal: (month) => {
    const { expenses } = get()
    const m = month ?? new Date().toISOString().slice(0, 7)
    return expenses
      .filter(e => e.date.startsWith(m) && e.sharedWith?.length)
      .reduce((total, e) => {
        const pending = (e.sharedWith ?? []).filter(p => !p.paid).reduce((s, p) => s + p.amount, 0)
        return total + pending
      }, 0)
  },

  // ── Preferences ─────────────────────────────────────────────────────────────
  setTheme: (theme) => {
    set(state => ({ preferences: { ...state.preferences, theme } }))
    const { user } = get()
    if (user) supabase.from('user_preferences').update({ theme }).eq('user_id', user.id).then(({ error }) => { if (error) console.error(error) })
  },

  getBudgetForMonth: (month) => {
    const { monthlyBudgets, preferences } = get()
    const entry = monthlyBudgets.find(b => b.month === month)
    if (entry) return { monthlyBudget: entry.monthlyBudget, categoryBudgets: entry.categoryBudgets }
    const sorted = monthlyBudgets
      .filter(b => b.month < month)
      .sort((a, b) => b.month.localeCompare(a.month))
    if (sorted[0]) return { monthlyBudget: sorted[0].monthlyBudget, categoryBudgets: sorted[0].categoryBudgets }
    return { monthlyBudget: preferences.monthlyBudget, categoryBudgets: preferences.categoryBudgets }
  },

  saveBudgetForMonth: async (month, data) => {
    const { user, preferences } = get()
    if (!user) return
    const monthlyBudgets = get().monthlyBudgets
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(month + '-01T12:00:00')
      d.setMonth(d.getMonth() + i)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
    const rows = months.map(m => {
      const existing = monthlyBudgets.find(b => b.month === m)
      return {
        id: existing?.id ?? nanoid(),
        month: m,
        monthly_budget: data.monthlyBudget ?? existing?.monthlyBudget ?? preferences.monthlyBudget,
        category_budgets: data.categoryBudgets ?? existing?.categoryBudgets ?? preferences.categoryBudgets,
        user_id: user.id,
      }
    })
    const { error } = await supabase.from('monthly_budgets').upsert(rows, { onConflict: 'user_id,month' })
    if (error) { console.error(error); return }
    set(state => {
      const updated = [...state.monthlyBudgets]
      rows.forEach(r => {
        const entry: MonthlyBudget = { id: r.id, month: r.month, monthlyBudget: r.monthly_budget, categoryBudgets: r.category_budgets }
        const idx = updated.findIndex(b => b.month === r.month)
        if (idx >= 0) updated[idx] = entry
        else updated.push(entry)
      })
      return { monthlyBudgets: updated }
    })
    const todayMonth = new Date().toISOString().slice(0, 7)
    if (month === todayMonth) {
      if (data.monthlyBudget !== undefined) {
        set(s => ({ preferences: { ...s.preferences, monthlyBudget: data.monthlyBudget! } }))
        supabase.from('user_preferences').update({ monthly_budget: data.monthlyBudget }).eq('user_id', user.id)
      }
      if (data.categoryBudgets !== undefined) {
        set(s => ({ preferences: { ...s.preferences, categoryBudgets: data.categoryBudgets! } }))
        supabase.from('user_preferences').update({ category_budgets: data.categoryBudgets }).eq('user_id', user.id)
      }
    }
  },

  setMonthlyBudget: (monthlyBudget) => {
    const month = new Date().toISOString().slice(0, 7)
    get().saveBudgetForMonth(month, { monthlyBudget })
  },

  setBudgetMode: (budgetMode) => {
    set(state => ({ preferences: { ...state.preferences, budgetMode } }))
    const { user } = get()
    if (user) supabase.from('user_preferences').update({ budget_mode: budgetMode }).eq('user_id', user.id).then(({ error }) => { if (error) console.error(error) })
  },

  setAvailableMode: (availableMode) => {
    set(state => ({ preferences: { ...state.preferences, availableMode } }))
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

  setAllCategoryBudgets: (budgets) => {
    const month = new Date().toISOString().slice(0, 7)
    get().saveBudgetForMonth(month, { categoryBudgets: budgets })
  },

  setWhatsappNumber: async (number) => {
    set(state => ({ preferences: { ...state.preferences, whatsappNumber: number } }))
    const { user } = get()
    if (user) {
      const { error } = await supabase.from('user_preferences').update({ whatsapp_number: number }).eq('user_id', user.id)
      if (error) console.error(error)
    }
  },
}))

export { getCurrentWeekKey }
