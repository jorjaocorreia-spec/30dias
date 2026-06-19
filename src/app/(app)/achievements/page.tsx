'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { AchievementContext, getAchievementStatuses, AchievementStatus } from '@/lib/achievements'
import { AchievementIcon } from '@/components/ui/AchievementIcon'
import { formatDate, getTodayKey } from '@/lib/weekHelpers'

const CATEGORY_LABELS: Record<AchievementStatus['achievement']['category'], string> = {
  usage: 'Uso',
  consistency: 'Consistência',
  goals: 'Metas',
  budget: 'Orçamento',
  milestones: 'Marcos',
}

export default function AchievementsPage() {
  const {
    expenses, incomeEntries, financialGoals, goalContributions,
    fixedExpenses, fixedExpenseMonths, categories, establishments,
    monthlyBudgets, preferences, userAchievements,
  } = useAppStore()

  const statuses = useMemo(() => {
    const ctx: AchievementContext = {
      expenses, incomeEntries, financialGoals, goalContributions,
      fixedExpenses, fixedExpenseMonths, categories,
      establishmentsCount: establishments.length,
      monthlyBudgets,
      defaultMonthlyBudget: preferences.monthlyBudget,
      budgetMode: preferences.budgetMode,
      hasWhatsappNumber: !!preferences.whatsappNumber,
      today: getTodayKey(),
    }
    return getAchievementStatuses(ctx, userAchievements.map(a => ({ achievementId: a.achievementId, unlockedAt: a.unlockedAt })))
  }, [expenses, incomeEntries, financialGoals, goalContributions, fixedExpenses, fixedExpenseMonths, categories, establishments, monthlyBudgets, preferences, userAchievements])

  const unlockedCount = statuses.filter(s => s.unlocked).length
  const totalCount = statuses.length
  const overallPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  const categoryOrder: AchievementStatus['achievement']['category'][] = ['usage', 'consistency', 'goals', 'budget', 'milestones']

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.3px' }}>Conquistas</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{unlockedCount} de {totalCount} desbloqueadas</p>
      </div>

      {/* Overall progress */}
      <motion.div
        className="p-4 rounded-2xl border mb-6 flex items-center gap-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(139,92,246,0.2))' }}
        >
          <Trophy size={22} style={{ color: '#10b981' }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-syne)' }}>Progresso geral</p>
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-dm-mono)', color: 'var(--accent)' }}>{overallPercent}%</p>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, #10b981, #8b5cf6)' }}
            />
          </div>
        </div>
      </motion.div>

      {/* Groups */}
      {categoryOrder.map(cat => {
        const items = statuses.filter(s => s.achievement.category === cat)
        if (items.length === 0) return null
        return (
          <div key={cat} className="mb-6">
            <p
              className="text-xs font-semibold mb-3 uppercase"
              style={{ fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.15em', color: 'var(--text-muted)' }}
            >
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map(({ achievement, unlocked, unlockedAt, progress, target }) => (
                <motion.div
                  key={achievement.id}
                  className="p-4 rounded-2xl border flex items-start gap-3"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', opacity: unlocked ? 1 : 0.7 }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: unlocked ? 1 : 0.7, y: 0 }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: unlocked ? 'rgba(16,185,129,0.18)' : 'var(--bg-input)' }}
                  >
                    <AchievementIcon
                      name={achievement.icon}
                      size={18}
                      style={{ color: unlocked ? '#10b981' : 'var(--text-dim)' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: unlocked ? 'var(--text)' : 'var(--text-muted)' }}>
                      {achievement.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{achievement.description}</p>
                    {unlocked && unlockedAt ? (
                      <p className="text-xs mt-1.5 font-medium" style={{ color: '#10b981', fontFamily: 'var(--font-dm-mono)' }}>
                        Desbloqueada em {formatDate(unlockedAt)}
                      </p>
                    ) : progress !== undefined && target !== undefined ? (
                      <div className="mt-2">
                        <div className="w-full h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'var(--bg-input)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, (progress / target) * 100)}%`, background: 'var(--accent)' }}
                          />
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-dm-mono)' }}>
                          {target >= 1000 ? `R$ ${progress.toFixed(0)} / R$ ${target}` : `${progress}/${target}`}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
