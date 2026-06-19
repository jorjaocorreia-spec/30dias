import { supabaseAdmin } from '@/lib/supabase-admin'
import { fromDB } from '@/lib/dbMapping'
import { getTodayKey } from '@/lib/weekHelpers'
import { Achievement, AchievementContext, evaluateAchievements } from '@/lib/achievements'
import {
  Expense, IncomeEntry, FinancialGoal, GoalContribution,
  FixedExpense, FixedExpenseMonth, Category, MonthlyBudget,
} from '@/types'
import { nanoid } from 'nanoid'

// Mesma regra de negócio usada pelo app web (src/store/useAppStore.ts → checkAchievements),
// mas lendo direto do Supabase com service role — usada pelo webhook do WhatsApp, que não
// tem acesso ao Zustand store do cliente.
export async function checkAchievementsForUser(userId: string): Promise<Achievement[]> {
  const [expRes, incRes, goalsRes, contribRes, feRes, femRes, catRes, estRes, mbRes, prefRes, achRes] =
    await Promise.all([
      supabaseAdmin.from('expenses').select('*').eq('user_id', userId),
      supabaseAdmin.from('income_entries').select('*').eq('user_id', userId),
      supabaseAdmin.from('financial_goals').select('*').eq('user_id', userId),
      supabaseAdmin.from('goal_contributions').select('*').eq('user_id', userId),
      supabaseAdmin.from('fixed_expenses').select('*').eq('user_id', userId),
      supabaseAdmin.from('fixed_expense_months').select('*').eq('user_id', userId),
      supabaseAdmin.from('categories').select('*').eq('user_id', userId),
      supabaseAdmin.from('establishments').select('id').eq('user_id', userId),
      supabaseAdmin.from('monthly_budgets').select('*').eq('user_id', userId),
      supabaseAdmin.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('user_achievements').select('achievement_id').eq('user_id', userId),
    ])

  const prefs = prefRes.data ? fromDB<{ monthlyBudget?: number; budgetMode?: 'fixed' | 'per_category'; whatsappNumber?: string }>(prefRes.data) : null

  const ctx: AchievementContext = {
    expenses: expRes.data?.map(r => fromDB<Expense>(r)) ?? [],
    incomeEntries: incRes.data?.map(r => fromDB<IncomeEntry>(r)) ?? [],
    financialGoals: goalsRes.data?.map(r => fromDB<FinancialGoal>(r)) ?? [],
    goalContributions: contribRes.data?.map(r => fromDB<GoalContribution>(r)) ?? [],
    fixedExpenses: feRes.data?.map(r => fromDB<FixedExpense>(r)) ?? [],
    fixedExpenseMonths: femRes.data?.map(r => fromDB<FixedExpenseMonth>(r)) ?? [],
    categories: catRes.data?.map(r => fromDB<Category>(r)) ?? [],
    establishmentsCount: estRes.data?.length ?? 0,
    monthlyBudgets: mbRes.data?.map(r => fromDB<MonthlyBudget>(r)) ?? [],
    defaultMonthlyBudget: prefs?.monthlyBudget ?? 4000,
    budgetMode: prefs?.budgetMode ?? 'fixed',
    hasWhatsappNumber: !!prefs?.whatsappNumber,
    today: getTodayKey(),
  }

  const unlockedIds = new Set((achRes.data ?? []).map(r => r.achievement_id as string))
  const newlyUnlocked = evaluateAchievements(ctx, unlockedIds)
    .filter(r => r.result.unlocked)
    .map(r => r.achievement)

  if (newlyUnlocked.length === 0) return []

  const { error } = await supabaseAdmin.from('user_achievements').insert(
    newlyUnlocked.map(a => ({
      id: nanoid(),
      user_id: userId,
      achievement_id: a.id,
      unlocked_at: getTodayKey(),
    }))
  )
  if (error) console.error('[achievements] insert error:', error)

  return newlyUnlocked
}
