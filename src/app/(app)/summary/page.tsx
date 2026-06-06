'use client'

import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, History, TrendingUp, TrendingDown } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { useAppStore, getCurrentWeekKey } from '@/store/useAppStore'
import {
  buildWeekSummary, formatCurrency, formatWeekLabel,
  getPreviousWeekKey, getNextWeekKey, getWeekDays, toLocalDateKey,
  getEffectiveAmount, getWeekOfMonth, getCurrentWeekKey as getWeekKeyNow,
} from '@/lib/weekHelpers'
import { CategoryIcon } from '@/components/ui/CategoryIcon'

const DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const HISTORY_PAGE = 6

export default function SummaryPage() {
  const { expenses, categories, preferences, getFixedWeeklyContribution, getGoalWeeklyTotal, getMonthlyBalance, getBudgetForMonth } = useAppStore()

  const [viewMode, setViewMode] = useState<'weeks' | 'months'>('weeks')
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey())
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [monthHistoryExpanded, setMonthHistoryExpanded] = useState(false)
  const [expandedWeekCatId, setExpandedWeekCatId] = useState<string | null>(null)
  const [expandedMonthCatId, setExpandedMonthCatId] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const isCurrentWeek = weekKey === getCurrentWeekKey()

  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [monthKey, setMonthKey] = useState(currentMonthKey)
  const isCurrentMonth = monthKey === currentMonthKey

  const weeksInCurrentMonth = getWeekOfMonth(getWeekKeyNow()).total
  const { monthlyBudget: currentMonthBudget } = getBudgetForMonth(currentMonthKey)
  const effectiveBudget = currentMonthBudget / weeksInCurrentMonth + getFixedWeeklyContribution() + getGoalWeeklyTotal(true)

  // --- Week data ---
  const summary = useMemo(
    () => buildWeekSummary(weekKey, expenses, effectiveBudget),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekKey, expenses, effectiveBudget]
  )

  const prevSummary = useMemo(
    () => buildWeekSummary(getPreviousWeekKey(weekKey), expenses, effectiveBudget),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekKey, expenses, effectiveBudget]
  )

  const weekDays = getWeekDays(weekKey)
  const dailyData = weekDays.map((d, i) => {
    const key = toLocalDateKey(d)
    return { day: DAYS_SHORT[i], amount: summary.byDay[key] || 0 }
  })

  const categoryData = Object.entries(summary.byCategory)
    .map(([id, amount]) => {
      const cat = categories.find((c) => c.id === id)
      return {
        id, name: cat?.name ?? id, amount, color: cat?.color ?? '#6b7280',
        icon: cat?.icon ?? 'MoreHorizontal',
        percent: summary.totalAmount > 0 ? (amount / summary.totalAmount) * 100 : 0,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  const budgetPercent = summary.budget > 0
    ? Math.min((summary.totalAmount / summary.budget) * 100, 100)
    : 0
  const remaining = summary.budget - summary.totalAmount
  const weekChange = prevSummary.totalAmount > 0
    ? ((summary.totalAmount - prevSummary.totalAmount) / prevSummary.totalAmount) * 100
    : 0

  const pastWeeks = useMemo(() => {
    const keys = [...new Set(expenses.map((e) => e.weekKey))]
      .filter((k) => k < getCurrentWeekKey())
      .sort((a, b) => b.localeCompare(a))
    return keys.map((k) => {
      const s = buildWeekSummary(k, expenses, effectiveBudget)
      return {
        weekKey: k,
        label: formatWeekLabel(k),
        total: s.totalAmount,
        budget: s.budget,
        count: s.expenses.length,
        pct: s.budget > 0 ? Math.min((s.totalAmount / s.budget) * 100, 100) : 0,
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, effectiveBudget])

  const visibleHistory = historyExpanded ? pastWeeks : pastWeeks.slice(0, HISTORY_PAGE)

  // --- Month data ---
  const monthBalance = getMonthlyBalance(monthKey)

  const monthExpenses = useMemo(
    () => expenses.filter(e => e.date.startsWith(monthKey)),
    [expenses, monthKey]
  )

  const monthCategoryData = useMemo(() => {
    const byCategory = monthExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.categoryId] = (acc[e.categoryId] || 0) + getEffectiveAmount(e)
      return acc
    }, {})
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0)
    return Object.entries(byCategory)
      .map(([id, amount]) => {
        const cat = categories.find(c => c.id === id)
        return {
          id, name: cat?.name ?? id, amount, color: cat?.color ?? '#6b7280',
          icon: cat?.icon ?? 'MoreHorizontal',
          percent: total > 0 ? (amount / total) * 100 : 0,
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [monthExpenses, categories])

  const last6MonthsData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const bal = getMonthlyBalance(key)
      return {
        month: key,
        label: d.toLocaleDateString('pt-BR', { month: 'short' }),
        expenses: bal.expenses,
        isSelected: key === monthKey,
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, monthKey])

  const pastMonths = useMemo(() => {
    const keys = [...new Set(expenses.map(e => e.date.substring(0, 7)))]
      .filter(k => k < currentMonthKey)
      .sort((a, b) => b.localeCompare(a))
    return keys.map(m => {
      const bal = getMonthlyBalance(m)
      const [y, mo] = m.split('-').map(Number)
      return {
        monthKey: m,
        label: new Date(y, mo - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        ...bal,
        count: expenses.filter(e => e.date.startsWith(m)).length,
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses])

  const visibleMonthHistory = monthHistoryExpanded ? pastMonths : pastMonths.slice(0, HISTORY_PAGE)

  const monthLabel = (() => {
    const [y, mo] = monthKey.split('-').map(Number)
    return new Date(y, mo - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  })()

  const prevMonth = () => {
    const [y, mo] = monthKey.split('-').map(Number)
    const d = new Date(y, mo - 2, 1)
    setMonthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const nextMonth = () => {
    const [y, mo] = monthKey.split('-').map(Number)
    const d = new Date(y, mo, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (next <= currentMonthKey) setMonthKey(next)
  }

  function goToWeek(key: string) {
    setWeekKey(key)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function goToMonth(key: string) {
    setMonthKey(key)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div ref={topRef} className="px-4 py-5 lg:px-8 lg:py-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Resumo</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {viewMode === 'weeks' ? formatWeekLabel(weekKey) : monthLabel}
          </p>
        </div>
        {viewMode === 'weeks' ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setWeekKey(getPreviousWeekKey(weekKey))}
              className="w-8 h-8 flex items-center justify-center rounded-xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setWeekKey(getCurrentWeekKey())}
              disabled={isCurrentWeek}
              className="px-2.5 py-1 rounded-xl text-xs font-medium border disabled:opacity-40"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            >
              Atual
            </button>
            <button
              onClick={() => setWeekKey(getNextWeekKey(weekKey))}
              disabled={isCurrentWeek}
              className="w-8 h-8 flex items-center justify-center rounded-xl border disabled:opacity-40"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setMonthKey(currentMonthKey)}
              disabled={isCurrentMonth}
              className="px-2.5 py-1 rounded-xl text-xs font-medium border disabled:opacity-40"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            >
              Atual
            </button>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="w-8 h-8 flex items-center justify-center rounded-xl border disabled:opacity-40"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* View mode tabs */}
      <div className="flex rounded-xl p-0.5 mb-5" style={{ background: 'var(--bg-input)' }}>
        {(['weeks', 'months'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="flex-1 py-2 rounded-lg text-xs font-medium"
            style={{
              background: viewMode === mode ? 'var(--bg-card)' : 'transparent',
              color: viewMode === mode ? 'var(--text)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            }}
          >
            {mode === 'weeks' ? 'Semanas' : 'Meses'}
          </button>
        ))}
      </div>

      {viewMode === 'weeks' ? (
        <>
          {/* Total card */}
          <motion.div
            className="p-5 rounded-2xl border mb-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total gasto</p>
            <p className="text-4xl font-bold mb-3">{formatCurrency(summary.totalAmount)}</p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3">
              <span style={{ color: 'var(--text-muted)' }}>
                Limite: <strong style={{ color: 'var(--text)' }}>{formatCurrency(summary.budget)}</strong>
              </span>
              <span style={{ color: remaining >= 0 ? '#10b981' : '#ef4444' }}>
                {remaining >= 0
                  ? `${formatCurrency(remaining)} disponível`
                  : `${formatCurrency(Math.abs(remaining))} acima`}
              </span>
              {prevSummary.totalAmount > 0 && (
                <span style={{ color: weekChange <= 0 ? '#10b981' : '#f59e0b' }}>
                  {weekChange <= 0 ? '▼' : '▲'} {Math.abs(weekChange).toFixed(0)}% vs anterior
                </span>
              )}
            </div>

            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }} animate={{ width: `${budgetPercent}%` }} transition={{ duration: 0.8 }}
                style={{
                  background: budgetPercent >= 90
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(90deg, #10b981, #06b6d4)',
                }}
              />
            </div>
          </motion.div>

          {/* Area chart */}
          <div
            className="p-4 rounded-2xl border mb-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <p className="text-sm font-semibold mb-3">Evolução diária</p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={dailyData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                  formatter={(v) => [formatCurrency(Number(v)), 'Gasto']}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#areaG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          {categoryData.length > 0 && (
            <div
              className="p-4 rounded-2xl border mb-4"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <p className="text-sm font-semibold mb-4">Por categoria</p>
              <div className="flex items-center gap-4 mb-4">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="amount" innerRadius={28} outerRadius={44} paddingAngle={3}>
                      {categoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5 min-w-0">
                  {categoryData.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="truncate flex-1" style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                      <span className="font-medium">{d.percent.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2.5">
                {categoryData.map((d) => {
                  const isExpanded = expandedWeekCatId === d.id
                  const catExpenses = summary.expenses
                    .filter(e => e.categoryId === d.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  return (
                    <div key={d.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          type="button"
                          aria-label={isExpanded ? `Fechar despesas de ${d.name}` : `Ver despesas de ${d.name}`}
                          onClick={() => setExpandedWeekCatId(v => v === d.id ? null : d.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: d.color + '20',
                            outline: isExpanded ? `1.5px solid ${d.color}` : 'none',
                            cursor: 'pointer',
                            border: 'none',
                          }}
                        >
                          <CategoryIcon name={d.icon} size={12} style={{ color: d.color }} />
                        </button>
                        <span className="text-xs flex-1 truncate">{d.name}</span>
                        <span className="text-xs font-bold">{formatCurrency(d.amount)}</span>
                      </div>
                      <div className="ml-8 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${d.percent}%` }} transition={{ duration: 0.6 }}
                          style={{ background: d.color }}
                        />
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="ml-8 mt-2 space-y-1.5 pb-1">
                              {catExpenses.map(e => (
                                <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                                  style={{ background: 'var(--bg-input)' }}>
                                  <p className="text-xs truncate flex-1">{e.description}</p>
                                  <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                                    {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                  </p>
                                  <p className="text-xs font-bold flex-shrink-0" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                                    {formatCurrency(getEffectiveAmount(e))}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* All expenses */}
          <div
            className="p-4 rounded-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <p className="text-sm font-semibold mb-3">
              Despesas ({summary.expenses.length})
            </p>
            {summary.expenses.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                Nenhuma despesa esta semana.
              </p>
            ) : (
              <div className="space-y-2">
                {[...summary.expenses]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => {
                    const cat = categories.find((c) => c.id === expense.categoryId)
                    return (
                      <div
                        key={expense.id}
                        className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'var(--bg-input)' }}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: (cat?.color ?? '#6b7280') + '20' }}
                        >
                          <CategoryIcon name={cat?.icon ?? 'MoreHorizontal'} size={14}
                            style={{ color: cat?.color ?? '#6b7280' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{expense.description}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {cat?.name} · {new Date(expense.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className="text-sm font-bold flex-shrink-0">{formatCurrency(getEffectiveAmount(expense))}</p>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Week history */}
          {pastWeeks.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <History size={14} style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-semibold">Histórico</p>
                <span className="text-xs px-1.5 py-0.5 rounded-lg" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                  {pastWeeks.length} semanas
                </span>
              </div>
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <AnimatePresence initial={false}>
                  {visibleHistory.map((w, i) => {
                    const isSelected = w.weekKey === weekKey
                    const barColor = w.pct >= 100
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                      : w.pct >= 80 ? '#f59e0b'
                      : 'linear-gradient(90deg, #10b981, #06b6d4)'
                    return (
                      <motion.button
                        key={w.weekKey}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => goToWeek(w.weekKey)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3"
                        style={{
                          background: isSelected ? 'var(--accent-light)' : 'transparent',
                          cursor: 'pointer',
                          border: 'none',
                          borderBottomWidth: i < visibleHistory.length - 1 ? 1 : 0,
                          borderBottomStyle: 'solid',
                          borderBottomColor: 'var(--border)',
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium truncate" style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                              {w.label}
                            </p>
                            <p className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                              {formatCurrency(w.total)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${w.pct}%`, background: barColor, transition: 'width 0.4s ease' }}
                              />
                            </div>
                            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)', minWidth: 28 }}>
                              {w.pct.toFixed(0)}%
                            </span>
                            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                              {w.count} {w.count === 1 ? 'despesa' : 'despesas'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      </motion.button>
                    )
                  })}
                </AnimatePresence>
              </div>
              {pastWeeks.length > HISTORY_PAGE && (
                <button
                  onClick={() => setHistoryExpanded((v) => !v)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  {historyExpanded
                    ? <><ChevronUp size={13} /> Mostrar menos</>
                    : <><ChevronDown size={13} /> Ver mais {pastWeeks.length - HISTORY_PAGE} semanas</>
                  }
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Monthly summary card */}
          <motion.div
            className="p-5 rounded-2xl border mb-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs mb-3 capitalize" style={{ color: 'var(--text-muted)' }}>{monthLabel}</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#10b98120' }}>
                    <TrendingUp size={11} style={{ color: '#10b981' }} />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Receitas</p>
                </div>
                <p className="text-lg font-bold" style={{ color: '#10b981', fontFamily: 'var(--font-dm-mono)' }}>
                  {formatCurrency(monthBalance.income)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#f43f5e20' }}>
                    <TrendingDown size={11} style={{ color: '#f43f5e' }} />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Despesas</p>
                </div>
                <p className="text-lg font-bold" style={{ color: '#f43f5e', fontFamily: 'var(--font-dm-mono)' }}>
                  {formatCurrency(monthBalance.expenses)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: monthBalance.balance >= 0 ? '#06b6d420' : '#f59e0b20' }}
                  >
                    <TrendingUp size={11} style={{ color: monthBalance.balance >= 0 ? '#06b6d4' : '#f59e0b' }} />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Saldo</p>
                </div>
                <p
                  className="text-lg font-bold"
                  style={{ color: monthBalance.balance >= 0 ? '#06b6d4' : '#f59e0b', fontFamily: 'var(--font-dm-mono)' }}
                >
                  {monthBalance.balance >= 0 ? '+' : ''}{formatCurrency(monthBalance.balance)}
                </p>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {monthExpenses.length} {monthExpenses.length === 1 ? 'despesa' : 'despesas'} registradas
            </p>
          </motion.div>

          {/* 6-month trend chart */}
          <div
            className="p-4 rounded-2xl border mb-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <p className="text-sm font-semibold mb-3">Últimos 6 meses</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={last6MonthsData} barSize={28} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                  formatter={(v) => [formatCurrency(Number(v)), 'Despesas']}
                />
                <Bar dataKey="expenses" radius={[5, 5, 0, 0]}>
                  {last6MonthsData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.isSelected ? '#10b981' : d.month === currentMonthKey ? 'rgba(16,185,129,0.35)' : 'var(--bg-input)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly category breakdown */}
          {monthCategoryData.length > 0 && (
            <div
              className="p-4 rounded-2xl border mb-4"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <p className="text-sm font-semibold mb-4">Por categoria</p>
              <div className="flex items-center gap-4 mb-4">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={monthCategoryData} dataKey="amount" innerRadius={28} outerRadius={44} paddingAngle={3}>
                      {monthCategoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5 min-w-0">
                  {monthCategoryData.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="truncate flex-1" style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                      <span className="font-medium">{d.percent.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2.5">
                {monthCategoryData.map((d) => {
                  const isExpanded = expandedMonthCatId === d.id
                  const catExpenses = monthExpenses
                    .filter(e => e.categoryId === d.id)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  return (
                    <div key={d.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          type="button"
                          aria-label={isExpanded ? `Fechar despesas de ${d.name}` : `Ver despesas de ${d.name}`}
                          onClick={() => setExpandedMonthCatId(v => v === d.id ? null : d.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: d.color + '20',
                            outline: isExpanded ? `1.5px solid ${d.color}` : 'none',
                            cursor: 'pointer',
                            border: 'none',
                          }}
                        >
                          <CategoryIcon name={d.icon} size={12} style={{ color: d.color }} />
                        </button>
                        <span className="text-xs flex-1 truncate">{d.name}</span>
                        <span className="text-xs font-bold">{formatCurrency(d.amount)}</span>
                      </div>
                      <div className="ml-8 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${d.percent}%` }} transition={{ duration: 0.6 }}
                          style={{ background: d.color }}
                        />
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="ml-8 mt-2 space-y-1.5 pb-1">
                              {catExpenses.map(e => (
                                <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                                  style={{ background: 'var(--bg-input)' }}>
                                  <p className="text-xs truncate flex-1">{e.description}</p>
                                  <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                                    {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                  </p>
                                  <p className="text-xs font-bold flex-shrink-0" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                                    {formatCurrency(getEffectiveAmount(e))}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Monthly expense list */}
          {monthExpenses.length > 0 && (
            <div
              className="p-4 rounded-2xl border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <p className="text-sm font-semibold mb-3">
                Despesas ({monthExpenses.length})
              </p>
              <div className="space-y-2">
                {[...monthExpenses]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => {
                    const cat = categories.find((c) => c.id === expense.categoryId)
                    return (
                      <div
                        key={expense.id}
                        className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'var(--bg-input)' }}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: (cat?.color ?? '#6b7280') + '20' }}
                        >
                          <CategoryIcon name={cat?.icon ?? 'MoreHorizontal'} size={14}
                            style={{ color: cat?.color ?? '#6b7280' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{expense.description}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {cat?.name} · {new Date(expense.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className="text-sm font-bold flex-shrink-0">{formatCurrency(getEffectiveAmount(expense))}</p>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Month history */}
          {pastMonths.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <History size={14} style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-semibold">Histórico</p>
                <span className="text-xs px-1.5 py-0.5 rounded-lg" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                  {pastMonths.length} meses
                </span>
              </div>
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <AnimatePresence initial={false}>
                  {visibleMonthHistory.map((m, i) => {
                    const isSelected = m.monthKey === monthKey
                    return (
                      <motion.button
                        key={m.monthKey}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => goToMonth(m.monthKey)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3"
                        style={{
                          background: isSelected ? 'var(--accent-light)' : 'transparent',
                          cursor: 'pointer',
                          border: 'none',
                          borderBottomWidth: i < visibleMonthHistory.length - 1 ? 1 : 0,
                          borderBottomStyle: 'solid',
                          borderBottomColor: 'var(--border)',
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-medium capitalize truncate" style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                              {m.label}
                            </p>
                            <p className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: '#f43f5e' }}>
                              −{formatCurrency(m.expenses)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span style={{ color: '#10b981' }}>+{formatCurrency(m.income)}</span>
                            <span style={{ color: m.balance >= 0 ? '#06b6d4' : '#f59e0b' }}>
                              {m.balance >= 0 ? '+' : ''}{formatCurrency(m.balance)}
                            </span>
                            <span>{m.count} {m.count === 1 ? 'despesa' : 'despesas'}</span>
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      </motion.button>
                    )
                  })}
                </AnimatePresence>
              </div>
              {pastMonths.length > HISTORY_PAGE && (
                <button
                  onClick={() => setMonthHistoryExpanded((v) => !v)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  {monthHistoryExpanded
                    ? <><ChevronUp size={13} /> Mostrar menos</>
                    : <><ChevronDown size={13} /> Ver mais {pastMonths.length - HISTORY_PAGE} meses</>
                  }
                </button>
              )}
            </div>
          )}
        </>
      )}

    </div>
  )
}
