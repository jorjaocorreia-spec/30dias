import {
  Expense, IncomeEntry, FinancialGoal, GoalContribution,
  FixedExpense, FixedExpenseMonth, Category, MonthlyBudget,
} from '@/types'
import { getEffectiveAmount, getMondaysBetween, isInstallment, toLocalDateKey } from './weekHelpers'

export interface AchievementContext {
  expenses: Expense[]
  incomeEntries: IncomeEntry[]
  financialGoals: FinancialGoal[]
  goalContributions: GoalContribution[]
  fixedExpenses: FixedExpense[]
  fixedExpenseMonths: FixedExpenseMonth[]
  categories: Category[]
  establishmentsCount: number
  monthlyBudgets: MonthlyBudget[]
  defaultMonthlyBudget: number
  budgetMode: 'fixed' | 'per_category'
  hasWhatsappNumber: boolean
  today: string  // YYYY-MM-DD
}

export interface AchievementCheckResult {
  unlocked: boolean
  progress?: number
  target?: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'usage' | 'consistency' | 'goals' | 'budget' | 'milestones'
  check: (ctx: AchievementContext) => AchievementCheckResult
}

function addDays(dateKey: string, days: number): string {
  const d = new Date(dateKey + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return toLocalDateKey(d)
}

function currentMonthKey(dateKey: string): string {
  return dateKey.slice(0, 7)
}

function previousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const d = new Date(year, month - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Conta dias consecutivos com pelo menos 1 despesa, terminando hoje (ou ontem,
// se hoje ainda não tiver registro — dá a chance do usuário registrar mais tarde no dia).
export function currentDayStreak(expenseDates: string[], today: string): number {
  const dates = new Set(expenseDates)
  let cursor = dates.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (dates.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

function totalExpensesForMonth(ctx: AchievementContext, month: string): number {
  return ctx.expenses
    .filter(e => e.date.startsWith(month))
    .reduce((sum, e) => sum + getEffectiveAmount(e), 0)
}

function budgetForMonth(ctx: AchievementContext, month: string): number {
  const entry = ctx.monthlyBudgets.find(b => b.month === month)
  const base = entry
    ? (ctx.budgetMode === 'per_category'
      ? Object.values(entry.categoryBudgets ?? {}).reduce((s, v) => s + v, 0)
      : entry.monthlyBudget)
    : ctx.defaultMonthlyBudget
  const fixed = ctx.fixedExpenses.filter(fe => fe.isActive).reduce((s, fe) => s + fe.suggestedAmount, 0)
  const [year, mon] = month.split('-').map(Number)
  const weeksInMonth = getMondaysBetween(new Date(year, mon - 1, 1), new Date(year, mon, 0)).length || 1
  const goalWeekly = ctx.financialGoals
    .filter(g => g.isActive && !g.completedAt && g.deductFromBudget && g.weeklyAmount)
    .reduce((s, g) => s + (g.weeklyAmount ?? 0), 0)
  return base + fixed + goalWeekly * weeksInMonth
}

// Meses já encerrados (exclui o mês atual, em andamento) com pelo menos uma despesa.
function completedMonthsWithExpenses(ctx: AchievementContext): string[] {
  const thisMonth = currentMonthKey(ctx.today)
  const months = Array.from(new Set(ctx.expenses.map(e => e.date.slice(0, 7))))
    .filter(m => m < thisMonth)
    .sort()
  return months
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Uso/Onboarding ──────────────────────────────────────────────────────
  {
    id: 'first_expense',
    title: 'Primeiro passo',
    description: 'Registre sua primeira despesa',
    icon: 'PlusCircle',
    category: 'usage',
    check: ctx => ({ unlocked: ctx.expenses.length >= 1 }),
  },
  {
    id: 'first_income',
    title: 'Primeira receita',
    description: 'Registre sua primeira receita',
    icon: 'TrendingUp',
    category: 'usage',
    check: ctx => ({ unlocked: ctx.incomeEntries.length >= 1 }),
  },
  {
    id: 'first_category',
    title: 'Categoria própria',
    description: 'Crie uma categoria de despesa personalizada',
    icon: 'Tag',
    category: 'usage',
    check: ctx => ({ unlocked: ctx.categories.some(c => !c.isDefault) }),
  },
  {
    id: 'first_establishment',
    title: 'Primeiro estabelecimento',
    description: 'Cadastre um estabelecimento',
    icon: 'Store',
    category: 'usage',
    check: ctx => ({ unlocked: ctx.establishmentsCount >= 1 }),
  },
  {
    id: 'whatsapp_connected',
    title: 'Conectado',
    description: 'Vincule seu número de WhatsApp',
    icon: 'Smartphone',
    category: 'usage',
    check: ctx => ({ unlocked: ctx.hasWhatsappNumber }),
  },

  // ── Consistência ────────────────────────────────────────────────────────
  {
    id: 'streak_7_days',
    title: '7 dias seguidos',
    description: 'Registre despesas por 7 dias consecutivos',
    icon: 'Flame',
    category: 'consistency',
    check: ctx => {
      const streak = currentDayStreak(ctx.expenses.map(e => e.date), ctx.today)
      return { unlocked: streak >= 7, progress: Math.min(streak, 7), target: 7 }
    },
  },
  {
    id: 'streak_30_days',
    title: '30 dias seguidos',
    description: 'Registre despesas por 30 dias consecutivos',
    icon: 'Flame',
    category: 'consistency',
    check: ctx => {
      const streak = currentDayStreak(ctx.expenses.map(e => e.date), ctx.today)
      return { unlocked: streak >= 30, progress: Math.min(streak, 30), target: 30 }
    },
  },
  {
    id: 'expenses_50',
    title: '50 despesas registradas',
    description: 'Registre 50 despesas no total',
    icon: 'Receipt',
    category: 'consistency',
    check: ctx => ({ unlocked: ctx.expenses.length >= 50, progress: Math.min(ctx.expenses.length, 50), target: 50 }),
  },
  {
    id: 'fixed_month_complete',
    title: 'Mês completo',
    description: 'Confirme todas as despesas fixas de um mês',
    icon: 'CheckCircle2',
    category: 'consistency',
    check: ctx => {
      const activeFixed = ctx.fixedExpenses.filter(fe => fe.isActive)
      if (activeFixed.length === 0) return { unlocked: false }
      const months = new Set(ctx.fixedExpenseMonths.map(fem => fem.month))
      for (const month of months) {
        const confirmed = ctx.fixedExpenseMonths.filter(fem => fem.month === month).length
        if (confirmed >= activeFixed.length) return { unlocked: true }
      }
      return { unlocked: false }
    },
  },

  // ── Metas ───────────────────────────────────────────────────────────────
  {
    id: 'first_goal',
    title: 'Primeira meta',
    description: 'Crie sua primeira meta financeira',
    icon: 'Target',
    category: 'goals',
    check: ctx => ({ unlocked: ctx.financialGoals.length >= 1 }),
  },
  {
    id: 'first_goal_completed',
    title: 'Meta concluída',
    description: 'Conclua uma meta financeira',
    icon: 'Trophy',
    category: 'goals',
    check: ctx => ({ unlocked: ctx.financialGoals.some(g => !!g.completedAt) }),
  },
  {
    id: 'goals_completed_3',
    title: '3 metas concluídas',
    description: 'Conclua 3 metas financeiras',
    icon: 'Trophy',
    category: 'goals',
    check: ctx => {
      const count = ctx.financialGoals.filter(g => !!g.completedAt).length
      return { unlocked: count >= 3, progress: Math.min(count, 3), target: 3 }
    },
  },
  {
    id: 'goal_high_value',
    title: 'Meta de alto valor',
    description: 'Conclua uma meta de R$ 5.000 ou mais',
    icon: 'Gem',
    category: 'goals',
    check: ctx => ({ unlocked: ctx.financialGoals.some(g => !!g.completedAt && g.targetAmount >= 5000) }),
  },
  {
    id: 'goal_streak_3_months',
    title: '3 meses de contribuição',
    description: 'Contribua para a mesma meta por 3 meses seguidos',
    icon: 'CalendarCheck',
    category: 'goals',
    check: ctx => {
      const byGoal = new Map<string, Set<string>>()
      for (const c of ctx.goalContributions) {
        if (!byGoal.has(c.goalId)) byGoal.set(c.goalId, new Set())
        byGoal.get(c.goalId)!.add(c.month)
      }
      for (const months of byGoal.values()) {
        const sorted = Array.from(months).sort()
        let streak = 1
        let best = sorted.length > 0 ? 1 : 0
        for (let i = 1; i < sorted.length; i++) {
          streak = sorted[i] === previousMonthKey(sorted[i - 1]) ? streak : 1
          best = Math.max(best, streak)
        }
        if (best >= 3) return { unlocked: true }
      }
      return { unlocked: false }
    },
  },

  // ── Orçamento ───────────────────────────────────────────────────────────
  {
    id: 'budget_month_ok',
    title: 'Mês dentro do orçamento',
    description: 'Termine um mês sem ultrapassar o orçamento',
    icon: 'ShieldCheck',
    category: 'budget',
    check: ctx => {
      const months = completedMonthsWithExpenses(ctx)
      return { unlocked: months.some(m => totalExpensesForMonth(ctx, m) <= budgetForMonth(ctx, m)) }
    },
  },
  {
    id: 'budget_streak_3',
    title: '3 meses seguidos no orçamento',
    description: 'Fique dentro do orçamento por 3 meses consecutivos',
    icon: 'ShieldCheck',
    category: 'budget',
    check: ctx => {
      const months = completedMonthsWithExpenses(ctx)
      let streak = 0
      let best = 0
      for (const m of months) {
        if (totalExpensesForMonth(ctx, m) <= budgetForMonth(ctx, m)) {
          streak++
          best = Math.max(best, streak)
        } else {
          streak = 0
        }
      }
      return { unlocked: best >= 3, progress: Math.min(best, 3), target: 3 }
    },
  },
  {
    id: 'expense_reduction',
    title: 'Gastando menos',
    description: 'Reduza o gasto total em relação ao mês anterior',
    icon: 'TrendingDown',
    category: 'budget',
    check: ctx => {
      const months = completedMonthsWithExpenses(ctx)
      if (months.length < 2) return { unlocked: false }
      const last = months[months.length - 1]
      const prev = months[months.length - 2]
      if (previousMonthKey(last) !== prev) return { unlocked: false }
      return { unlocked: totalExpensesForMonth(ctx, last) < totalExpensesForMonth(ctx, prev) }
    },
  },
  {
    id: 'per_category_budget',
    title: 'Orçamento por categoria',
    description: 'Configure orçamentos individuais por categoria',
    icon: 'PieChart',
    category: 'budget',
    check: ctx => ({ unlocked: ctx.budgetMode === 'per_category' }),
  },

  // ── Marcos ──────────────────────────────────────────────────────────────
  {
    id: 'total_1000',
    title: 'R$ 1.000 registrados',
    description: 'Registre R$ 1.000 em despesas no total',
    icon: 'DollarSign',
    category: 'milestones',
    check: ctx => {
      const total = ctx.expenses.reduce((s, e) => s + getEffectiveAmount(e), 0)
      return { unlocked: total >= 1000, progress: Math.min(total, 1000), target: 1000 }
    },
  },
  {
    id: 'total_10000',
    title: 'R$ 10.000 registrados',
    description: 'Registre R$ 10.000 em despesas no total',
    icon: 'DollarSign',
    category: 'milestones',
    check: ctx => {
      const total = ctx.expenses.reduce((s, e) => s + getEffectiveAmount(e), 0)
      return { unlocked: total >= 10000, progress: Math.min(total, 10000), target: 10000 }
    },
  },
  {
    id: 'first_split',
    title: 'Despesa dividida',
    description: 'Registre sua primeira despesa dividida com alguém',
    icon: 'Users',
    category: 'milestones',
    check: ctx => ({ unlocked: ctx.expenses.some(e => (e.sharedWith?.length ?? 0) > 0) }),
  },
  {
    id: 'first_installment',
    title: 'Despesa parcelada',
    description: 'Registre sua primeira despesa parcelada',
    icon: 'CreditCard',
    category: 'milestones',
    check: ctx => ({ unlocked: ctx.expenses.some(isInstallment) }),
  },
]

export function evaluateAchievements(
  ctx: AchievementContext,
  unlockedIds: Set<string>
): { achievement: Achievement; result: AchievementCheckResult }[] {
  return ACHIEVEMENTS
    .filter(a => !unlockedIds.has(a.id))
    .map(achievement => ({ achievement, result: achievement.check(ctx) }))
}

export interface AchievementStatus {
  achievement: Achievement
  unlocked: boolean
  unlockedAt?: string
  progress?: number
  target?: number
}

// Status completo (desbloqueadas + bloqueadas com progresso) para exibição na página /achievements.
export function getAchievementStatuses(
  ctx: AchievementContext,
  unlockedRecords: { achievementId: string; unlockedAt: string }[]
): AchievementStatus[] {
  const unlockedMap = new Map(unlockedRecords.map(r => [r.achievementId, r.unlockedAt]))
  return ACHIEVEMENTS.map(achievement => {
    const unlockedAt = unlockedMap.get(achievement.id)
    if (unlockedAt) return { achievement, unlocked: true, unlockedAt }
    const result = achievement.check(ctx)
    return { achievement, unlocked: result.unlocked, progress: result.progress, target: result.target }
  })
}
