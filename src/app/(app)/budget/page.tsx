'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Target, Check, Lock, Calendar } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { formatCurrency } from '@/lib/weekHelpers'

export default function BudgetPage() {
  const { preferences, categories, financialGoals, getGoalWeeklyTotal, getGoalProgress, setWeeklyBudget, setBudgetMode, setCategoryBudget, getFixedWeeklyContribution, getFixedCategoryContribution } = useAppStore()
  const { budgetMode, weeklyBudget, categoryBudgets = {} } = preferences
  const fixedWeekly = getFixedWeeklyContribution()
  const fixedByCategory = getFixedCategoryContribution()
  const hasFixedContribution = fixedWeekly > 0
  const goalDeductWeekly = getGoalWeeklyTotal(true)
  const hasGoalDeduct = goalDeductWeekly > 0
  const infoGoals = financialGoals.filter(g => g.isActive && !g.completedAt && !g.deductFromBudget)

  const [fixedValue, setFixedValue] = useState(String(weeklyBudget))
  const [catValues, setCatValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      categories.map((c) => [c.id, categoryBudgets[c.id] ? String(categoryBudgets[c.id]) : ''])
    )
  )
  const [savedFixed, setSavedFixed] = useState(false)
  const [savedCat, setSavedCat] = useState(false)

  const totalCat = categories.reduce((sum, c) => {
    const v = parseFloat(catValues[c.id] ?? '')
    return sum + (isNaN(v) || v < 0 ? 0 : v)
  }, 0)
  const totalCatFixed = Object.values(fixedByCategory).reduce((a, b) => a + b, 0)
  const hasAnyCatFixed = Object.values(fixedByCategory).some(v => v > 0)

  const handleSaveFixed = () => {
    const v = parseFloat(fixedValue)
    if (!isNaN(v) && v > 0) {
      setWeeklyBudget(v)
      setSavedFixed(true)
      setTimeout(() => setSavedFixed(false), 2000)
    }
  }

  const handleSaveCat = () => {
    categories.forEach((c) => {
      const v = parseFloat(catValues[c.id] ?? '')
      setCategoryBudget(c.id, isNaN(v) || v < 0 ? 0 : v)
    })
    setSavedCat(true)
    setTimeout(() => setSavedCat(false), 2000)
  }

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold">Orçamento</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Defina quanto deseja gastar por semana
        </p>
      </div>

      {/* Mode toggle */}
      <div
        className="flex rounded-2xl p-1 mb-6"
        style={{ background: 'var(--bg-input)' }}
      >
        {([
          ['fixed', 'Valor fixo', Wallet],
          ['per_category', 'Por categoria', Target],
        ] as const).map(([mode, label, Icon]) => (
          <button
            key={mode}
            onClick={() => setBudgetMode(mode)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: budgetMode === mode ? 'var(--bg-card)' : 'transparent',
              color: budgetMode === mode ? 'var(--accent)' : 'var(--text-muted)',
              boxShadow: budgetMode === mode ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.2s',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Fixed mode */}
      {budgetMode === 'fixed' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm font-semibold mb-1">Orçamento semanal total</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Valor máximo disponível para gastar durante a semana
          </p>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: 'var(--text-muted)', pointerEvents: 'none' }}
              >
                R$
              </span>
              <input
                type="number"
                min="0"
                step="50"
                value={fixedValue}
                onChange={(e) => setFixedValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFixed()}
                className="w-full rounded-xl text-sm font-medium"
                style={{
                  padding: '11px 12px 11px 38px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={handleSaveFixed}
              className="px-5 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{
                background: savedFixed ? '#10b981' : 'linear-gradient(135deg, #10b981, #06b6d4)',
                color: '#fff',
                cursor: 'pointer',
                border: 'none',
                transition: 'background 0.3s',
                minWidth: 88,
                justifyContent: 'center',
              }}
            >
              {savedFixed ? <><Check size={15} /> Salvo!</> : 'Salvar'}
            </button>
          </div>

          {/* Preview */}
          {(hasFixedContribution || hasGoalDeduct) ? (
            <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-3 py-2.5" style={{ background: 'var(--bg-input)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Discricionário</span>
                <span className="text-sm font-medium">{formatCurrency(weeklyBudget)}</span>
              </div>
              {hasFixedContribution && (
                <div className="flex items-center justify-between px-3 py-2.5" style={{ background: 'var(--bg-input)', borderTop: '1px solid var(--border)' }}>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Lock size={11} /> Fixas (automático)
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(fixedWeekly)}
                  </span>
                </div>
              )}
              {hasGoalDeduct && (
                <div className="flex items-center justify-between px-3 py-2.5" style={{ background: 'var(--bg-input)', borderTop: '1px solid var(--border)' }}>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Target size={11} /> Metas (automático)
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(goalDeductWeekly)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-3 py-2.5" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                <span className="text-xs font-semibold">Total efetivo</span>
                <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  {formatCurrency(weeklyBudget + fixedWeekly + goalDeductWeekly)}
                </span>
              </div>
            </div>
          ) : (
            <div
              className="mt-4 p-3 rounded-xl flex items-center justify-between"
              style={{ background: 'var(--bg-input)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Orçamento atual</span>
              <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                {formatCurrency(weeklyBudget)}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Monthly estimate — fixed mode */}
      {budgetMode === 'fixed' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 p-5 rounded-2xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #10b98120, #06b6d420)' }}
            >
              <Calendar size={15} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold">Estimativa mensal</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Com base em 4 semanas por mês
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Discricionário</span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(weeklyBudget)}/sem × 4
                </span>
                <span className="text-sm font-medium">{formatCurrency(weeklyBudget * 4)}</span>
              </div>
            </div>
            {hasFixedContribution && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Lock size={10} /> Fixas (mensal)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(fixedWeekly)}/sem × 4
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(fixedWeekly * 4)}
                  </span>
                </div>
              </div>
            )}
            {hasGoalDeduct && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Target size={10} /> Metas (reserva)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(goalDeductWeekly)}/sem × 4
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(goalDeductWeekly * 4)}
                  </span>
                </div>
              </div>
            )}
            <div
              className="flex items-center justify-between pt-2 mt-2"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="text-sm font-semibold">Total estimado / mês</span>
              <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                {formatCurrency((weeklyBudget + fixedWeekly + goalDeductWeekly) * 4)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Informational goals — fixed mode */}
      {budgetMode === 'fixed' && infoGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 p-5 rounded-2xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Target size={15} style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-semibold">Sugestão de poupança</p>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Metas não deduzidas do orçamento — apenas para acompanhamento
          </p>
          <div className="space-y-2">
            {infoGoals.map(g => {
              const { effectiveWeekly, percentage } = getGoalProgress(g.id)
              return (
                <div key={g.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryIcon name={g.icon} size={13} color={g.color} />
                    <span className="text-sm">{g.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{percentage}%</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: g.color }}>
                    {formatCurrency(effectiveWeekly)}/sem
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Per category mode */}
      {budgetMode === 'per_category' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="rounded-2xl border overflow-hidden mb-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold">Orçamento por categoria</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Deixe em branco as categorias sem limite definido
              </p>
            </div>

            {hasAnyCatFixed && (
              <div className="flex items-center gap-3 px-5 py-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
                <div className="w-8 flex-shrink-0" />
                <span className="flex-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Categoria</span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)', width: 90, justifyContent: 'flex-end' }}>
                  <Lock size={10} /> Fixas
                </span>
                <span className="text-xs text-right" style={{ color: 'var(--text-muted)', width: 120 }}>Discricionário</span>
              </div>
            )}
            {categories.map((cat, i) => {
              const catFixed = fixedByCategory[cat.id] ?? 0
              const manualVal = parseFloat(catValues[cat.id] ?? '')
              const manualNum = isNaN(manualVal) || manualVal < 0 ? 0 : manualVal
              const effective = manualNum + catFixed
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{
                    borderBottom: i < categories.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cat.color + '20' }}
                  >
                    <CategoryIcon name={cat.icon} size={15} style={{ color: cat.color }} />
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">{cat.name}</span>
                  {hasAnyCatFixed && (
                    <span className="text-xs text-right" style={{ color: catFixed > 0 ? 'var(--text-muted)' : 'transparent', width: 90 }}>
                      {catFixed > 0 ? formatCurrency(catFixed) : '—'}
                    </span>
                  )}
                  <div className="relative" style={{ width: 120 }}>
                    <span
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: 'var(--text-muted)', pointerEvents: 'none' }}
                    >
                      R$
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="—"
                      value={catValues[cat.id] ?? ''}
                      onChange={(e) =>
                        setCatValues((prev) => ({ ...prev, [cat.id]: e.target.value }))
                      }
                      className="w-full rounded-xl text-sm text-right"
                      style={{
                        padding: '8px 10px 8px 28px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {hasAnyCatFixed && effective > 0 && (
                    <span className="text-xs font-semibold text-right" style={{ color: 'var(--accent)', width: 72, flexShrink: 0 }}>
                      {formatCurrency(effective)}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Footer: total + save */}
          <div
            className="flex items-center justify-between p-4 rounded-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {(hasAnyCatFixed || hasGoalDeduct) ? 'Total efetivo semanal' : 'Total semanal'}
              </p>
              <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                {formatCurrency(totalCat + totalCatFixed + goalDeductWeekly)}
              </p>
              {(hasAnyCatFixed || hasGoalDeduct) && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(totalCat)} disc.
                  {hasAnyCatFixed && ` + ${formatCurrency(totalCatFixed)} fixas`}
                  {hasGoalDeduct && ` + ${formatCurrency(goalDeductWeekly)} metas`}
                </p>
              )}
            </div>
            <button
              onClick={handleSaveCat}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{
                background: savedCat ? '#10b981' : 'linear-gradient(135deg, #10b981, #06b6d4)',
                color: '#fff',
                cursor: 'pointer',
                border: 'none',
                transition: 'background 0.3s',
                minWidth: 120,
                justifyContent: 'center',
              }}
            >
              {savedCat ? <><Check size={15} /> Salvo!</> : 'Salvar tudo'}
            </button>
          </div>
          {/* Monthly estimate — per category mode */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4 p-5 rounded-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #10b98120, #06b6d420)' }}
              >
                <Calendar size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold">Estimativa mensal</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Com base em 4 semanas por mês
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Discricionário</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(totalCat)}/sem × 4
                  </span>
                  <span className="text-sm font-medium">{formatCurrency(totalCat * 4)}</span>
                </div>
              </div>
              {hasAnyCatFixed && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Lock size={10} /> Fixas (mensal)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatCurrency(totalCatFixed)}/sem × 4
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      {formatCurrency(totalCatFixed * 4)}
                    </span>
                  </div>
                </div>
              )}
              {hasGoalDeduct && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Target size={10} /> Metas (reserva)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatCurrency(goalDeductWeekly)}/sem × 4
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      {formatCurrency(goalDeductWeekly * 4)}
                    </span>
                  </div>
                </div>
              )}
              <div
                className="flex items-center justify-between pt-2 mt-2"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <span className="text-sm font-semibold">Total estimado / mês</span>
                <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                  {formatCurrency((totalCat + totalCatFixed + goalDeductWeekly) * 4)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Informational goals — per category mode */}
          {infoGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 p-5 rounded-2xl border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Target size={15} style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-semibold">Sugestão de poupança</p>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Metas não deduzidas do orçamento — apenas para acompanhamento
              </p>
              <div className="space-y-2">
                {infoGoals.map(g => {
                  const { effectiveWeekly, percentage } = getGoalProgress(g.id)
                  return (
                    <div key={g.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon name={g.icon} size={13} color={g.color} />
                        <span className="text-sm">{g.name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{percentage}%</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: g.color }}>
                        {formatCurrency(effectiveWeekly)}/sem
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
