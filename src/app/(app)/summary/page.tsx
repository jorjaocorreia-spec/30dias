'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { useAppStore, getCurrentWeekKey } from '@/store/useAppStore'
import {
  buildWeekSummary, formatCurrency, formatWeekLabel,
  getPreviousWeekKey, getNextWeekKey, getWeekDays, toLocalDateKey,
} from '@/lib/weekHelpers'
import { CategoryIcon } from '@/components/ui/CategoryIcon'

const DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export default function SummaryPage() {
  const { expenses, categories, preferences } = useAppStore()
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey())
  const isCurrentWeek = weekKey === getCurrentWeekKey()

  const summary = useMemo(
    () => buildWeekSummary(weekKey, expenses, preferences.weeklyBudget),
    [weekKey, expenses, preferences.weeklyBudget]
  )

  const prevSummary = useMemo(
    () => buildWeekSummary(getPreviousWeekKey(weekKey), expenses, preferences.weeklyBudget),
    [weekKey, expenses, preferences.weeklyBudget]
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

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Resumo</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatWeekLabel(weekKey)}</p>
        </div>
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
      </div>

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

          {/* Donut + legend */}
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

          {/* Bars */}
          <div className="space-y-2.5">
            {categoryData.map((d) => (
              <div key={d.id}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: d.color + '20' }}>
                    <CategoryIcon name={d.icon} size={12} style={{ color: d.color }} />
                  </div>
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
              </div>
            ))}
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
                    <p className="text-sm font-bold flex-shrink-0">{formatCurrency(expense.amount)}</p>
                  </div>
                )
              })}
          </div>
        )}
      </div>

    </div>
  )
}
