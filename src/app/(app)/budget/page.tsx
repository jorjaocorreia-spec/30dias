'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Target, Check, Lock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { formatCurrency, getWeekOfMonth, getCurrentWeekKey } from '@/lib/weekHelpers'

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatMonthLabel(month: string) {
  const [y, m] = month.split('-')
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`
}

function addMonths(month: string, delta: number) {
  const d = new Date(month + '-01T12:00:00')
  d.setMonth(d.getMonth() + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function BudgetPage() {
  const {
    preferences, categories, financialGoals,
    getGoalWeeklyTotal, getGoalProgress,
    setBudgetMode,
    getFixedMonthlyContribution, getFixedMonthlyCategoryContribution,
    getBudgetForMonth, saveBudgetForMonth,
  } = useAppStore()
  const { budgetMode } = preferences

  const todayMonth = new Date().toISOString().slice(0, 7)
  const [monthKey, setMonthKey] = useState(todayMonth)
  const isPast = monthKey < todayMonth

  const { monthlyBudget, categoryBudgets = {} } = getBudgetForMonth(monthKey)

  const fixedMonthly = getFixedMonthlyContribution()
  const fixedByCategory = getFixedMonthlyCategoryContribution()
  const hasFixedContribution = fixedMonthly > 0
  const weeksInMonth = getWeekOfMonth(getCurrentWeekKey()).total

  const goalDeductWeekly = getGoalWeeklyTotal(true)
  const goalDeductMonthly = Math.round(goalDeductWeekly * weeksInMonth * 100) / 100
  const hasGoalDeduct = goalDeductMonthly > 0
  const infoGoals = financialGoals.filter(g => g.isActive && !g.completedAt && !g.deductFromBudget)

  const [fixedValue, setFixedValue] = useState(String(monthlyBudget))
  const [catValues, setCatValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      categories.map((c) => [c.id, categoryBudgets[c.id] ? String(categoryBudgets[c.id]) : ''])
    )
  )
  const [savedFixed, setSavedFixed] = useState(false)
  const [savedCat, setSavedCat] = useState(false)

  // Reset form when month changes
  useEffect(() => {
    const { monthlyBudget: mb, categoryBudgets: cb = {} } = getBudgetForMonth(monthKey)
    setFixedValue(String(mb))
    setCatValues(Object.fromEntries(
      categories.map((c) => [c.id, cb[c.id] ? String(cb[c.id]) : ''])
    ))
    setSavedFixed(false)
    setSavedCat(false)
  }, [monthKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalCat = categories.reduce((sum, c) => {
    const v = parseFloat(catValues[c.id] ?? '')
    return sum + (isNaN(v) || v < 0 ? 0 : v)
  }, 0)
  const totalCatFixed = Object.values(fixedByCategory).reduce((a, b) => a + b, 0)
  const hasAnyCatFixed = Object.values(fixedByCategory).some(v => v > 0)

  const handleSaveFixed = async () => {
    if (isPast) return
    const v = parseFloat(fixedValue)
    if (!isNaN(v) && v > 0) {
      await saveBudgetForMonth(monthKey, { monthlyBudget: v })
      setSavedFixed(true)
      setTimeout(() => setSavedFixed(false), 2000)
    }
  }

  const handleSaveCat = async () => {
    if (isPast) return
    const budgets = Object.fromEntries(
      categories.map((c) => {
        const v = parseFloat(catValues[c.id] ?? '')
        return [c.id, isNaN(v) || v < 0 ? 0 : v]
      })
    )
    await saveBudgetForMonth(monthKey, { categoryBudgets: budgets })
    setSavedCat(true)
    setTimeout(() => setSavedCat(false), 2000)
  }

  const weeklyHint = (monthly: number) =>
    monthly > 0
      ? `≈ ${formatCurrency(Math.round((monthly / weeksInMonth) * 100) / 100)}/sem`
      : null

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">Orçamento</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Defina quanto deseja gastar por mês
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5 rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <button
          onClick={() => setMonthKey(addMonths(monthKey, -1))}
          className="flex items-center justify-center w-8 h-8 rounded-xl"
          style={{ background: 'var(--bg-input)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{formatMonthLabel(monthKey)}</span>
          {isPast && (
            <span
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--amber-light)', color: 'var(--amber)' }}
            >
              <Lock size={10} /> Bloqueado
            </span>
          )}
          {monthKey === todayMonth && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              Atual
            </span>
          )}
        </div>
        <button
          onClick={() => setMonthKey(addMonths(monthKey, 1))}
          className="flex items-center justify-center w-8 h-8 rounded-xl"
          style={{ background: 'var(--bg-input)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Past month notice */}
      {isPast && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm"
          style={{ background: 'var(--amber-light)', color: 'var(--amber)', border: '1px solid var(--amber)' + '33' }}
        >
          <Lock size={14} />
          Mês encerrado — valores históricos preservados
        </div>
      )}

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
            onClick={() => !isPast && setBudgetMode(mode)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: budgetMode === mode ? 'var(--bg-card)' : 'transparent',
              color: budgetMode === mode ? 'var(--accent)' : 'var(--text-muted)',
              boxShadow: budgetMode === mode ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.2s',
              cursor: isPast ? 'not-allowed' : 'pointer',
              border: 'none',
              opacity: isPast ? 0.6 : 1,
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
          <p className="text-sm font-semibold mb-1">Orçamento mensal total</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Valor máximo disponível para gastar durante o mês
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
                step="100"
                value={fixedValue}
                onChange={(e) => !isPast && setFixedValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFixed()}
                disabled={isPast}
                className="w-full rounded-xl text-sm font-medium"
                style={{
                  padding: '11px 12px 11px 38px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: isPast ? 'var(--text-muted)' : 'var(--text)',
                  outline: 'none',
                  cursor: isPast ? 'not-allowed' : 'text',
                  opacity: isPast ? 0.7 : 1,
                }}
              />
            </div>
            {!isPast && (
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
            )}
          </div>

          {/* Summary */}
          {(hasFixedContribution || hasGoalDeduct) ? (
            <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-3 py-2.5" style={{ background: 'var(--bg-input)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Variáveis</span>
                <span className="text-sm font-medium">{formatCurrency(monthlyBudget)}</span>
              </div>
              {hasFixedContribution && (
                <div className="flex items-center justify-between px-3 py-2.5" style={{ background: 'var(--bg-input)', borderTop: '1px solid var(--border)' }}>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Lock size={11} /> Fixas (automático)
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(fixedMonthly)}
                  </span>
                </div>
              )}
              {hasGoalDeduct && (
                <div className="flex items-center justify-between px-3 py-2.5" style={{ background: 'var(--bg-input)', borderTop: '1px solid var(--border)' }}>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Target size={11} /> Metas (automático)
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(goalDeductMonthly)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-3 py-2.5" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                <span className="text-xs font-semibold">Total mensal</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                    {formatCurrency(monthlyBudget + fixedMonthly + goalDeductMonthly)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end px-3 py-1.5" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-dm-mono)' }}>
                  {weeklyHint(monthlyBudget + fixedMonthly + goalDeductMonthly)} · {weeksInMonth} semanas este mês
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-3 py-2.5" style={{ background: 'var(--bg-input)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Orçamento mensal</span>
                <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  {formatCurrency(monthlyBudget)}
                </span>
              </div>
              {monthlyBudget > 0 && (
                <div className="flex items-center justify-end px-3 py-1.5" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-dm-mono)' }}>
                    {weeklyHint(monthlyBudget)} · {weeksInMonth} semanas este mês
                  </span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Informational goals — fixed mode */}
      {budgetMode === 'fixed' && infoGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
              const monthlyNeeded = Math.round(effectiveWeekly * weeksInMonth * 100) / 100
              return (
                <div key={g.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryIcon name={g.icon} size={13} color={g.color} />
                    <span className="text-sm">{g.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{percentage}%</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: g.color }}>
                    {formatCurrency(monthlyNeeded)}/mês
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
              <p className="text-sm font-semibold">Orçamento mensal por categoria</p>
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
                <span className="text-xs text-right" style={{ color: 'var(--text-muted)', width: 120 }}>Variáveis/mês</span>
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
                      step="50"
                      placeholder="—"
                      value={catValues[cat.id] ?? ''}
                      disabled={isPast}
                      onChange={(e) =>
                        !isPast && setCatValues((prev) => ({ ...prev, [cat.id]: e.target.value }))
                      }
                      className="w-full rounded-xl text-sm text-right"
                      style={{
                        padding: '8px 10px 8px 28px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        color: isPast ? 'var(--text-muted)' : 'var(--text)',
                        outline: 'none',
                        cursor: isPast ? 'not-allowed' : 'text',
                        opacity: isPast ? 0.7 : 1,
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
            className="rounded-2xl border overflow-hidden mb-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {(hasAnyCatFixed || hasGoalDeduct) ? 'Total mensal efetivo' : 'Total mensal'}
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                  {formatCurrency(totalCat + totalCatFixed + goalDeductMonthly)}
                </p>
                {(hasAnyCatFixed || hasGoalDeduct) && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(totalCat)} variáveis
                    {hasAnyCatFixed && ` + ${formatCurrency(totalCatFixed)} fixas`}
                    {hasGoalDeduct && ` + ${formatCurrency(goalDeductMonthly)} metas`}
                  </p>
                )}
              </div>
              {!isPast && (
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
              )}
            </div>
            {/* Weekly hint */}
            <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-input)' }}>
              <span className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-dm-mono)' }}>
                {weeklyHint(totalCat + totalCatFixed + goalDeductMonthly)} · {weeksInMonth} semanas este mês
              </span>
            </div>
          </div>

          {/* Informational goals — per category mode */}
          {infoGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
                  const monthlyNeeded = Math.round(effectiveWeekly * weeksInMonth * 100) / 100
                  return (
                    <div key={g.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon name={g.icon} size={13} color={g.color} />
                        <span className="text-sm">{g.name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{percentage}%</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: g.color }}>
                        {formatCurrency(monthlyNeeded)}/mês
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
