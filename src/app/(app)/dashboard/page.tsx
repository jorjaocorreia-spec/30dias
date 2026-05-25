'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PlusCircle, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Wallet, Target, ArrowUpDown, AlertTriangle, XCircle } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAppStore, getCurrentWeekKey } from '@/store/useAppStore'
import {
  buildWeekSummary, formatCurrency, formatWeekLabel,
  getPreviousWeekKey, getNextWeekKey, getWeekDays, formatDate, toLocalDateKey,
} from '@/lib/weekHelpers'
import { CategoryIcon } from '@/components/ui/CategoryIcon'

const DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export default function DashboardPage() {
  const { expenses, categories, preferences, getMonthlyBalance, getFixedWeeklyContribution, getFixedCategoryContribution, getSharedPendingTotal } = useAppStore()
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey())
  const today = toLocalDateKey(new Date())
  const [selectedDay, setSelectedDay] = useState(today)

  const fixedWeekly = getFixedWeeklyContribution()
  const fixedByCategory = getFixedCategoryContribution()

  const effectiveBudget = preferences.budgetMode === 'per_category'
    ? Object.values(preferences.categoryBudgets ?? {}).reduce((a, b) => a + b, 0)
      + Object.values(fixedByCategory).reduce((a, b) => a + b, 0)
    : preferences.weeklyBudget + fixedWeekly

  const summary = useMemo(
    () => buildWeekSummary(weekKey, expenses, effectiveBudget),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekKey, expenses, effectiveBudget]
  )

  const weekDays = getWeekDays(weekKey)

  // Reset selectedDay when navigating weeks
  useEffect(() => {
    const days = weekDays.map((d) => toLocalDateKey(d))
    setSelectedDay(days.includes(today) ? today : days[0])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekKey])

  const dailyData = weekDays.map((d, i) => {
    const key = toLocalDateKey(d)
    return { day: DAYS_SHORT[i], amount: summary.byDay[key] || 0, date: key }
  })

  const categoryData = Object.entries(summary.byCategory)
    .map(([id, amount]) => {
      const cat = categories.find((c) => c.id === id)
      return { name: cat?.name ?? id, amount, color: cat?.color ?? '#6b7280' }
    })
    .sort((a, b) => b.amount - a.amount)

  const budgetPercent = Math.min((summary.totalAmount / summary.budget) * 100, 100)
  const remaining = summary.budget - summary.totalAmount
  const isCurrentWeek = weekKey === getCurrentWeekKey()

  const currentMonthKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()
  const monthBalance = getMonthlyBalance(currentMonthKey)
  const sharedPending = getSharedPendingTotal(currentMonthKey)

  const selectedDayExpenses = summary.expenses
    .filter((e) => e.date === selectedDay)
    .sort((a, b) => b.description.localeCompare(a.description))

  const selectedDayLabel = (() => {
    const d = new Date(selectedDay + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  })()

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-3xl mx-auto lg:max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {formatWeekLabel(weekKey)}
          </p>
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
            Hoje
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

      {/* KPI Cards — 2 cols mobile, 3 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {[
          {
            icon: Wallet,
            label: 'Gasto total',
            value: formatCurrency(summary.totalAmount),
            sub: `de ${formatCurrency(summary.budget)}`,
            color: '#10b981',
          },
          {
            icon: Target,
            label: 'Disponível',
            value: formatCurrency(Math.abs(remaining)),
            sub: remaining < 0 ? 'acima do limite' : 'restante',
            color: remaining < 0 ? '#ef4444' : '#06b6d4',
          },
          {
            icon: TrendingDown,
            label: 'Despesas',
            value: String(summary.expenses.length),
            sub: 'esta semana',
            color: '#8b5cf6',
            colSpanMobile: sharedPending === 0,
          },
          ...(sharedPending > 0 ? [{
            icon: ArrowUpDown,
            label: 'A receber',
            value: formatCurrency(sharedPending),
            sub: 'de despesas divididas',
            color: '#f59e0b',
            colSpanMobile: false,
          }] : []),
        ].map(({ icon: Icon, label, value, sub, color, colSpanMobile }, i) => (
          <motion.div
            key={label}
            className={`p-4 rounded-2xl border ${colSpanMobile ? 'col-span-2 lg:col-span-1' : ''}`}
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '20' }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p className="text-xl font-bold leading-none mb-1">{value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Budget bar */}
      <motion.div
        className="p-4 rounded-2xl border mb-5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
      >
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Orçamento da semana</p>
            {preferences.budgetMode === 'per_category' && (
              <span
                className="text-xs px-2 py-0.5 rounded-lg font-medium"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                Por categoria
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold"
              style={{ color: budgetPercent >= 90 ? '#ef4444' : 'var(--accent)' }}
            >
              {budgetPercent.toFixed(0)}%
            </span>
            <Link
              href="/budget"
              className="text-xs px-2 py-1 rounded-lg"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}
            >
              Configurar
            </Link>
          </div>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${budgetPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background: budgetPercent >= 90
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                : 'linear-gradient(90deg, #10b981, #06b6d4)',
            }}
          />
        </div>

        {/* Alert banner — 80–99% (amber) or 100%+ (red) */}
        {budgetPercent >= 80 && isCurrentWeek && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
            style={{
              background: budgetPercent >= 100 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              border: `1px solid ${budgetPercent >= 100 ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
            }}
          >
            {budgetPercent >= 100
              ? <XCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              : <AlertTriangle size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
            }
            <div>
              <p className="text-xs font-semibold" style={{ color: budgetPercent >= 100 ? '#ef4444' : '#f59e0b' }}>
                {budgetPercent >= 100
                  ? `Orçamento ultrapassado em ${formatCurrency(summary.totalAmount - summary.budget)}`
                  : `${budgetPercent.toFixed(0)}% do orçamento utilizado`
                }
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {budgetPercent >= 100
                  ? 'Você já passou do limite semanal.'
                  : `Faltam ${formatCurrency(remaining)} para o limite de ${formatCurrency(summary.budget)}.`
                }
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Monthly balance */}
      <motion.div
        className="p-4 rounded-2xl border mb-5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Saldo do mês</p>
          <Link
            href="/income"
            className="text-xs px-2 py-1 rounded-lg"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}
          >
            Ver receitas
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#10b98120' }}>
                <TrendingUp size={11} style={{ color: '#10b981' }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Receitas</p>
            </div>
            <p className="text-base font-bold" style={{ color: '#10b981' }}>
              {formatCurrency(monthBalance.income)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#ef444420' }}>
                <TrendingDown size={11} style={{ color: '#ef4444' }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Despesas</p>
            </div>
            <p className="text-base font-bold" style={{ color: '#ef4444' }}>
              {formatCurrency(monthBalance.expenses)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: monthBalance.balance >= 0 ? '#06b6d420' : '#f59e0b20' }}
              >
                <ArrowUpDown size={11} style={{ color: monthBalance.balance >= 0 ? '#06b6d4' : '#f59e0b' }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Saldo</p>
            </div>
            <p
              className="text-base font-bold"
              style={{ color: monthBalance.balance >= 0 ? '#06b6d4' : '#f59e0b' }}
            >
              {monthBalance.balance >= 0 ? '+' : ''}{formatCurrency(monthBalance.balance)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Charts — stacked on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">

        {/* Bar chart */}
        <div
          className="lg:col-span-3 p-4 rounded-2xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Gastos por dia</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Clique para filtrar</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={dailyData}
              barSize={24}
              margin={{ top: 0, right: 0, left: -24, bottom: 0 }}
              style={{ cursor: 'pointer' }}
            >
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  fontSize: 12,
                }}
                formatter={(v) => [formatCurrency(Number(v)), 'Gasto']}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar
                dataKey="amount"
                radius={[5, 5, 0, 0]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={(data: any) => setSelectedDay(data.date)}
              >
                {dailyData.map((d) => (
                  <Cell
                    key={d.date}
                    fill={
                      d.date === selectedDay
                        ? '#10b981'
                        : d.date === today
                        ? 'rgba(16,185,129,0.25)'
                        : 'var(--bg-input)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div
          className="lg:col-span-2 p-4 rounded-2xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm font-semibold mb-3">Por categoria</p>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={categoryData} dataKey="amount" innerRadius={30} outerRadius={48} paddingAngle={3}>
                    {categoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    formatter={(v) => [formatCurrency(Number(v))]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 min-w-0">
                {categoryData.slice(0, 4).map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="truncate" style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                    </div>
                    <span className="font-medium flex-shrink-0">{formatCurrency(d.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-28" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">Sem gastos</p>
            </div>
          )}
        </div>
      </div>

      {/* Per-category budget breakdown */}
      {preferences.budgetMode === 'per_category' &&
        categories.some((c) => (preferences.categoryBudgets?.[c.id] ?? 0) > 0) && (
        <motion.div
          className="p-4 rounded-2xl border mb-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        >
          <p className="text-sm font-semibold mb-4">Orçamento por categoria</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {categories
              .filter((c) => (preferences.categoryBudgets?.[c.id] ?? 0) > 0)
              .map((cat) => {
                const spent = summary.byCategory[cat.id] ?? 0
                const budget = preferences.categoryBudgets?.[cat.id] ?? 0
                const pct = Math.min((spent / budget) * 100, 100)
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: cat.color + '20' }}
                        >
                          <CategoryIcon name={cat.icon} size={13} style={{ color: cat.color }} />
                        </div>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold">{formatCurrency(spent)}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {' '}/ {formatCurrency(budget)}
                        </span>
                      </div>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--bg-input)' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        style={{
                          background: pct >= 90
                            ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                            : `linear-gradient(90deg, ${cat.color}, ${cat.color}bb)`,
                        }}
                      />
                    </div>
                    {pct >= 80 && isCurrentWeek && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {pct >= 100
                          ? <XCircle size={11} style={{ color: '#ef4444', flexShrink: 0 }} />
                          : <AlertTriangle size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        }
                        <p className="text-xs" style={{ color: pct >= 100 ? '#ef4444' : '#f59e0b' }}>
                          {pct >= 100
                            ? `Limite ultrapassado`
                            : `${pct.toFixed(0)}% utilizado`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </motion.div>
      )}

      {/* Recent expenses */}
      <div
        className="p-4 rounded-2xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold">Despesas</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{selectedDayLabel}</p>
          </div>
          <Link
            href="/expenses/new"
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl"
            style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}
          >
            <PlusCircle size={12} /> Nova
          </Link>
        </div>

        {selectedDayExpenses.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm">Nenhuma despesa em {selectedDayLabel}.</p>
            <Link href="/expenses/new" className="inline-block mt-2 text-sm font-medium" style={{ color: 'var(--accent)' }}>
              Adicionar agora →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDayExpenses.map((expense) => {
              const cat = categories.find((c) => c.id === expense.categoryId)
              return (
                <Link
                  key={expense.id}
                  href={`/expenses/${expense.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl active:opacity-70"
                  style={{ background: 'var(--bg-input)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: (cat?.color ?? '#6b7280') + '20' }}
                  >
                    <CategoryIcon name={cat?.icon ?? 'MoreHorizontal'} size={16} style={{ color: cat?.color ?? '#6b7280' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{expense.description}</p>
                      {expense.fixedExpenseId && (
                        <span className="text-xs px-1.5 py-0.5 rounded-lg font-medium flex-shrink-0"
                          style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontSize: 10 }}>
                          🔁
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {cat?.name} · {formatDate(expense.date)}
                    </p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0">{formatCurrency(expense.amount)}</p>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
