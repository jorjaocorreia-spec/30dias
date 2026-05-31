'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Wallet, Target, ArrowUpDown, AlertTriangle, XCircle, X, Check, Users } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAppStore } from '@/store/useAppStore'
import {
  formatCurrency, formatDate, getEffectiveAmount, getCurrentWeekKey,
  getWeekKey, getWeekStart, getMondaysBetween,
} from '@/lib/weekHelpers'
import { CategoryIcon } from '@/components/ui/CategoryIcon'

export default function DashboardPage() {
  const {
    expenses, categories, preferences, financialGoals, goalContributions,
    getGoalProgress, getMonthlyBalance, getFixedMonthlyContribution,
    getFixedMonthlyCategoryContribution, getGoalWeeklyTotal,
    getSharedPendingTotal, markParticipantAsPaid,
  } = useAppStore()
  const router = useRouter()

  const currentMonthKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  const [monthKey, setMonthKey] = useState(currentMonthKey)
  const [selectedWeekKey, setSelectedWeekKey] = useState(getCurrentWeekKey())
  const isCurrentMonth = monthKey === currentMonthKey

  const prevMonth = () => {
    const [year, month] = monthKey.split('-').map(Number)
    const d = new Date(year, month - 2, 1)
    setMonthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const nextMonth = () => {
    const [year, month] = monthKey.split('-').map(Number)
    const d = new Date(year, month, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (next <= currentMonthKey) setMonthKey(next)
  }

  const formatMonthLabel = (m: string) => {
    const [year, month] = m.split('-')
    const label = new Date(Number(year), Number(month) - 1, 1)
      .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  const weeksOfMonth = useMemo(() => {
    const [year, month] = monthKey.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    return getMondaysBetween(firstDay, lastDay).map(m => getWeekKey(m))
  }, [monthKey])

  useEffect(() => {
    const currentWk = getCurrentWeekKey()
    const [year, month] = monthKey.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const weeks = getMondaysBetween(firstDay, lastDay).map(m => getWeekKey(m))
    setSelectedWeekKey(weeks.includes(currentWk) ? currentWk : (weeks[weeks.length - 1] ?? currentWk))
  }, [monthKey])

  const monthExpenses = useMemo(
    () => expenses.filter(e => e.date.startsWith(monthKey)),
    [expenses, monthKey]
  )

  const monthBalance = getMonthlyBalance(monthKey)
  const fixedMonthly = getFixedMonthlyContribution(monthKey)
  const fixedByCatMonthly = getFixedMonthlyCategoryContribution(monthKey)
  const goalDeductMonthly = getGoalWeeklyTotal(true) * weeksOfMonth.length

  const totalMonthlyBudget = preferences.budgetMode === 'per_category'
    ? categories.reduce((sum, c) => sum + (preferences.categoryBudgets?.[c.id] ?? 0), 0)
      + fixedMonthly + goalDeductMonthly
    : preferences.monthlyBudget + fixedMonthly + goalDeductMonthly

  const totalMonthlyExpenses = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + getEffectiveAmount(e), 0),
    [monthExpenses]
  )

  const fixedMonthExpenses = useMemo(
    () => monthExpenses.filter(e => !!e.fixedExpenseId).reduce((sum, e) => sum + getEffectiveAmount(e), 0),
    [monthExpenses]
  )
  const variableMonthExpenses = monthBalance.expenses - fixedMonthExpenses

  const budgetPercent = totalMonthlyBudget > 0
    ? Math.min((totalMonthlyExpenses / totalMonthlyBudget) * 100, 100)
    : 0
  const remaining = totalMonthlyBudget - totalMonthlyExpenses

  const sharedPending = getSharedPendingTotal(monthKey)

  const activeGoals = useMemo(
    () => financialGoals.filter(g => g.isActive && !g.completedAt),
    [financialGoals]
  )
  const avgGoalProgress = useMemo(() => {
    if (activeGoals.length === 0) return 0
    const total = activeGoals.reduce((sum, g) => sum + getGoalProgress(g.id).percentage, 0)
    return Math.round(total / activeGoals.length)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGoals, goalContributions])

  const projection = useMemo(() => {
    if (!isCurrentMonth || totalMonthlyExpenses === 0) return null
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysElapsed = now.getDate()
    const projected = (totalMonthlyExpenses / daysElapsed) * daysInMonth
    const delta = monthBalance.income > 0 ? projected - monthBalance.income : null
    return { projected, delta, daysElapsed }
  }, [isCurrentMonth, totalMonthlyExpenses, monthBalance.income])

  const weeklyData = useMemo(() =>
    weeksOfMonth.map((wk) => {
      const weekExpenses = monthExpenses.filter(e => e.weekKey === wk)
      const amount = weekExpenses.reduce((sum, e) => sum + getEffectiveAmount(e), 0)
      const monday = getWeekStart(wk)
      const label = monday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      return { weekKey: wk, label, amount }
    }),
    [weeksOfMonth, monthExpenses]
  )

  const categoryData = useMemo(() => {
    const byCat = monthExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.categoryId] = (acc[e.categoryId] || 0) + getEffectiveAmount(e)
      return acc
    }, {})
    return Object.entries(byCat)
      .map(([id, amount]) => {
        const cat = categories.find(c => c.id === id)
        return { id, name: cat?.name ?? id, amount, color: cat?.color ?? '#6b7280' }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [monthExpenses, categories])

  const selectedWeekExpenses = useMemo(
    () => monthExpenses
      .filter(e => e.weekKey === selectedWeekKey)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [monthExpenses, selectedWeekKey]
  )

  const selectedWeekLabel = useMemo(() => {
    const monday = getWeekStart(selectedWeekKey)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    return `${fmt(monday)} – ${fmt(sunday)}`
  }, [selectedWeekKey])

  const currentWeekKey = getCurrentWeekKey()

  const [sharedDrawerOpen, setSharedDrawerOpen] = useState(false)
  const [drawerMonth, setDrawerMonth] = useState(currentMonthKey)

  const sharedExpenses = useMemo(
    () => expenses
      .filter(e => e.date.startsWith(drawerMonth) && e.sharedWith?.length)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, drawerMonth]
  )

  const drawerPendingTotal = useMemo(
    () => sharedExpenses.reduce((total, e) => {
      return total + (e.sharedWith ?? []).filter(p => !p.paid).reduce((s, p) => s + p.amount, 0)
    }, 0),
    [sharedExpenses]
  )

  const prevDrawerMonth = () => {
    const [year, month] = drawerMonth.split('-').map(Number)
    const d = new Date(year, month - 2, 1)
    setDrawerMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const nextDrawerMonth = () => {
    const [year, month] = drawerMonth.split('-').map(Number)
    const d = new Date(year, month, 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (next <= currentMonthKey) setDrawerMonth(next)
  }

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-3xl mx-auto lg:max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.3px' }}>Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.05em' }}>
            {formatMonthLabel(monthKey)}
          </p>
        </div>
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
            Hoje
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
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-2 gap-3 mb-5 ${(sharedPending > 0 || activeGoals.length > 0) ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {[
          {
            icon: Wallet,
            label: 'Gastos do mês',
            value: formatCurrency(totalMonthlyExpenses),
            sub: `de ${formatCurrency(totalMonthlyBudget)}`,
            color: '#10b981',
          },
          {
            icon: TrendingDown,
            label: 'Disponível',
            value: formatCurrency(Math.abs(remaining)),
            sub: remaining < 0 ? 'acima do limite' : 'restante',
            color: remaining < 0 ? '#ef4444' : '#06b6d4',
          },
          {
            icon: TrendingUp,
            label: 'Receitas',
            value: formatCurrency(monthBalance.income),
            sub: 'este mês',
            color: '#8b5cf6',
            colSpanMobile: sharedPending === 0 && activeGoals.length === 0,
          },
          ...(sharedPending > 0 ? [{
            icon: ArrowUpDown,
            label: 'A receber',
            value: formatCurrency(sharedPending),
            sub: 'de despesas divididas',
            color: '#f59e0b',
            colSpanMobile: false,
            onClick: () => { setDrawerMonth(monthKey); setSharedDrawerOpen(true) },
          }] : []),
          ...(activeGoals.length > 0 ? [{
            icon: Target,
            label: 'Metas',
            value: `${avgGoalProgress}%`,
            sub: `${activeGoals.length} ativa${activeGoals.length > 1 ? 's' : ''}`,
            color: '#10b981',
            colSpanMobile: false,
            onClick: () => router.push('/goals'),
          }] : []),
        ].map(({ icon: Icon, label, value, sub, color, colSpanMobile, onClick }, i) => (
          <motion.div
            key={label}
            className={`p-4 rounded-2xl border ${colSpanMobile ? 'col-span-2 lg:col-span-1' : ''} ${onClick ? 'cursor-pointer' : ''}`}
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            onClick={onClick}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileTap={onClick ? { scale: 0.97 } : undefined}
          >
            <div className="flex items-start justify-between mb-2">
              <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 9 }}>{label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '20' }}>
                <Icon size={14} style={{ color, filter: `drop-shadow(0 0 4px ${color}80)` }} />
              </div>
            </div>
            <p className="text-xl font-bold leading-none mb-1" style={{ fontFamily: 'var(--font-dm-mono)', letterSpacing: '-0.5px' }}>{value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Monthly balance */}
      <motion.div
        className="p-4 rounded-2xl border mb-5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-syne)' }}>Saldo do mês</p>
          <Link href="/income" className="text-xs px-2 py-1 rounded-lg" style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}>
            Ver receitas
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Receitas', value: monthBalance.income, color: '#10b981', Icon: TrendingUp },
            {
              label: 'Despesas', value: monthBalance.expenses, color: '#f43f5e', Icon: TrendingDown,
              subLines: [
                { label: 'Fixa', value: fixedMonthExpenses, color: '#8b5cf6' },
                { label: 'Variável', value: variableMonthExpenses, color: '#f43f5e' },
              ],
            },
            { label: 'Saldo', value: monthBalance.balance, color: monthBalance.balance >= 0 ? '#06b6d4' : '#f59e0b', Icon: ArrowUpDown, sign: true },
          ].map(({ label, value, color, Icon, sign, subLines }) => (
            <div key={label}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: color + '20' }}>
                  <Icon size={11} style={{ color }} />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
              <p className="text-base font-bold" style={{ color, fontFamily: 'var(--font-dm-mono)' }}>
                {sign && value >= 0 ? '+' : ''}{formatCurrency(value)}
              </p>
              {subLines && subLines.map(sl => (
                <div key={sl.label} className="flex items-center justify-between mt-1 gap-1">
                  <span style={{ color: 'var(--text-dim)', fontSize: 10, whiteSpace: 'nowrap' }}>↳ {sl.label}</span>
                  <span style={{ color: sl.color, fontFamily: 'var(--font-dm-mono)', fontSize: 10, fontWeight: 600 }}>{formatCurrency(sl.value)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Budget bar */}
      <motion.div
        className="p-4 rounded-2xl border mb-5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
      >
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-syne)' }}>Orçamento do mês</p>
            {preferences.budgetMode === 'per_category' && (
              <span className="text-xs px-2 py-0.5 rounded-lg font-medium" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                Por categoria
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: budgetPercent >= 90 ? '#f43f5e' : 'var(--accent)', fontFamily: 'var(--font-dm-mono)' }}>
              {budgetPercent.toFixed(0)}%
            </span>
            <Link href="/budget" className="text-xs px-2 py-1 rounded-lg" style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}>
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
              background: budgetPercent >= 90 ? 'linear-gradient(90deg, #f59e0b, #f43f5e)' : 'linear-gradient(90deg, #10b981, #06b6d4)',
              boxShadow: budgetPercent >= 90 ? '0 0 12px rgba(244,63,94,0.5)' : '0 0 12px rgba(16,185,129,0.5)',
            }}
          />
        </div>

        {budgetPercent >= 80 && isCurrentMonth && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
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
                  ? `Orçamento ultrapassado em ${formatCurrency(totalMonthlyExpenses - totalMonthlyBudget)}`
                  : `${budgetPercent.toFixed(0)}% do orçamento mensal utilizado`
                }
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {budgetPercent >= 100
                  ? 'Você já passou do limite mensal.'
                  : `Faltam ${formatCurrency(remaining)} para o limite de ${formatCurrency(totalMonthlyBudget)}.`
                }
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Projection */}
      {projection && (
        <motion.div
          className="p-4 rounded-2xl border mb-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#8b5cf620' }}>
                <TrendingUp size={13} style={{ color: '#8b5cf6' }} />
              </div>
              <p className="text-sm font-semibold">Projeção do mês</p>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{projection.daysElapsed}d de dados</p>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-dm-mono)', letterSpacing: '-0.5px' }}>{formatCurrency(projection.projected)}</p>
          {projection.delta !== null ? (
            <div className="flex items-center gap-1.5">
              {projection.delta > 0
                ? <TrendingUp size={13} style={{ color: '#ef4444' }} />
                : <TrendingDown size={13} style={{ color: '#10b981' }} />
              }
              <p className="text-sm" style={{ color: projection.delta > 0 ? '#ef4444' : '#10b981' }}>
                {formatCurrency(Math.abs(projection.delta))}{' '}
                {projection.delta > 0 ? 'acima da sua renda' : 'abaixo da sua renda'}
              </p>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sem renda registrada este mês</p>
          )}
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">

        {/* Weekly bar chart */}
        <div className="lg:col-span-3 p-4 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-syne)' }}>Gastos por semana</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Clique para ver despesas</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={weeklyData}
              barSize={40}
              margin={{ top: 0, right: 0, left: -24, bottom: 0 }}
              style={{ cursor: 'pointer' }}
            >
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                formatter={(v) => [formatCurrency(Number(v)), 'Gasto']}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar
                dataKey="amount"
                radius={[5, 5, 0, 0]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={(data: any) => setSelectedWeekKey(data.weekKey)}
              >
                {weeklyData.map((d) => (
                  <Cell
                    key={d.weekKey}
                    fill={
                      d.weekKey === selectedWeekKey
                        ? '#10b981'
                        : d.weekKey === currentWeekKey
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
        <div className="lg:col-span-2 p-4 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-syne)' }}>Por categoria</p>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={categoryData} dataKey="amount" innerRadius={30} outerRadius={48} paddingAngle={3}>
                    {categoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
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
                const spent = categoryData.find(d => d.id === cat.id)?.amount ?? 0
                const budget = (preferences.categoryBudgets?.[cat.id] ?? 0) + (fixedByCatMonthly[cat.id] ?? 0)
                const rawPct = budget > 0 ? (spent / budget) * 100 : 0
                const barPct = Math.min(rawPct, 100)
                const isOver = rawPct > 100
                return (
                  <div
                    key={cat.id}
                    style={isOver ? {
                      background: 'rgba(244,63,94,0.07)',
                      border: '1px solid rgba(244,63,94,0.25)',
                      borderRadius: 12,
                      padding: '10px 12px',
                      margin: '0 -12px',
                    } : undefined}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isOver ? 'rgba(244,63,94,0.15)' : cat.color + '20' }}>
                          <CategoryIcon name={cat.icon} size={13} style={{ color: isOver ? '#f43f5e' : cat.color }} />
                        </div>
                        <span className="text-sm font-medium" style={isOver ? { color: '#f43f5e' } : undefined}>{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold" style={{ color: isOver ? '#f43f5e' : 'var(--text)' }}>{formatCurrency(spent)}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}> / {formatCurrency(budget)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: isOver ? 'rgba(244,63,94,0.15)' : 'var(--bg-input)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        style={{
                          background: isOver
                            ? 'linear-gradient(90deg, #f43f5e, #ef4444)'
                            : rawPct >= 90
                              ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                              : `linear-gradient(90deg, ${cat.color}, ${cat.color}bb)`,
                        }}
                      />
                    </div>
                    {isOver && isCurrentMonth && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <XCircle size={11} style={{ color: '#f43f5e', flexShrink: 0 }} />
                        <p className="text-xs font-medium" style={{ color: '#f43f5e' }}>Limite ultrapassado em {formatCurrency(spent - budget)}</p>
                      </div>
                    )}
                    {!isOver && rawPct >= 80 && isCurrentMonth && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <AlertTriangle size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        <p className="text-xs" style={{ color: '#f59e0b' }}>{rawPct.toFixed(0)}% utilizado</p>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </motion.div>
      )}

      {/* Shared Expenses Drawer */}
      <AnimatePresence>
        {sharedDrawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSharedDrawerOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 lg:left-56 right-0 z-50 flex flex-col"
              style={{ background: '#1a1a24', borderTop: '1px solid var(--border)', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85vh' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
              </div>
              <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f59e0b20' }}>
                    <Users size={15} style={{ color: '#f59e0b' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">A Receber</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {drawerPendingTotal > 0 ? `${formatCurrency(drawerPendingTotal)} pendente` : 'Tudo recebido!'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={prevDrawerMonth} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ background: 'var(--bg-input)' }}>
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-xs font-medium px-1" style={{ minWidth: 90, textAlign: 'center' }}>
                    {formatMonthLabel(drawerMonth)}
                  </span>
                  <button onClick={nextDrawerMonth} disabled={drawerMonth >= currentMonthKey} className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-30" style={{ background: 'var(--bg-input)' }}>
                    <ChevronRight size={13} />
                  </button>
                  <button onClick={() => setSharedDrawerOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg ml-1" style={{ background: 'var(--bg-input)' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {sharedExpenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Users size={32} style={{ opacity: 0.3 }} />
                    <p className="text-sm">Nenhuma despesa dividida em {formatMonthLabel(drawerMonth)}</p>
                  </div>
                ) : (
                  sharedExpenses.map(expense => {
                    const cat = categories.find(c => c.id === expense.categoryId)
                    const pendingCount = (expense.sharedWith ?? []).filter(p => !p.paid).length
                    const paidCount = (expense.sharedWith ?? []).filter(p => p.paid).length
                    return (
                      <div key={expense.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3 p-3" style={{ background: 'var(--bg-input)' }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: (cat?.color ?? '#6b7280') + '25' }}>
                            <CategoryIcon name={cat?.icon ?? 'MoreHorizontal'} size={16} style={{ color: cat?.color ?? '#6b7280' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{expense.description}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {formatDate(expense.date)} · {formatCurrency(expense.amount)} total
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>minha parte</p>
                            <p className="text-sm font-bold">{formatCurrency(getEffectiveAmount(expense))}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-input)' }}>
                          {pendingCount === 0
                            ? <span className="text-xs font-medium" style={{ color: '#10b981' }}>✓ Todos pagaram</span>
                            : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{paidCount}/{(expense.sharedWith ?? []).length} pagaram</span>
                          }
                        </div>
                        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                          {expense.sharedWith?.map(p => (
                            <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: p.paid ? '#10b98120' : 'var(--bg-input)', color: p.paid ? '#10b981' : 'var(--text-muted)' }}>
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{p.name}</p>
                                {p.paid && p.paidAt
                                  ? <p className="text-xs" style={{ color: '#10b981' }}>Pago em {formatDate(p.paidAt)}</p>
                                  : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pendente</p>
                                }
                              </div>
                              <p className="text-sm font-bold flex-shrink-0" style={{ color: p.paid ? '#10b981' : 'inherit' }}>
                                {formatCurrency(p.amount)}
                              </p>
                              <button
                                onClick={() => markParticipantAsPaid(expense.id, p.id, !p.paid)}
                                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl flex-shrink-0"
                                style={{ background: p.paid ? '#10b98120' : 'var(--bg-input)', color: p.paid ? '#10b981' : 'var(--text-muted)', border: `1px solid ${p.paid ? '#10b98140' : 'var(--border)'}`, minWidth: 72, justifyContent: 'center' }}
                              >
                                {p.paid ? <Check size={11} /> : null}
                                {p.paid ? 'Pago' : 'Pendente'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
                <div className="pt-2 pb-4 text-center">
                  <Link href="/expenses" onClick={() => setSharedDrawerOpen(false)} className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                    Ver todas as despesas →
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Week expenses list */}
      <div className="p-4 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold">Despesas</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{selectedWeekLabel}</p>
          </div>
          <Link href="/expenses/new" className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl" style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}>
            <PlusCircle size={12} /> Nova
          </Link>
        </div>

        {selectedWeekExpenses.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm">Nenhuma despesa nesta semana.</p>
            <Link href="/expenses/new" className="inline-block mt-2 text-sm font-medium" style={{ color: 'var(--accent)' }}>
              Adicionar agora →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedWeekExpenses.map((expense) => {
              const cat = categories.find((c) => c.id === expense.categoryId)
              return (
                <Link
                  key={expense.id}
                  href={`/expenses/${expense.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl active:opacity-70"
                  style={{ background: 'var(--bg-input)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: (cat?.color ?? '#6b7280') + '20' }}>
                    <CategoryIcon name={cat?.icon ?? 'MoreHorizontal'} size={16} style={{ color: cat?.color ?? '#6b7280' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{expense.description}</p>
                      {expense.fixedExpenseId && (
                        <span className="text-xs px-1.5 py-0.5 rounded-lg font-medium flex-shrink-0" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontSize: 10 }}>🔁</span>
                      )}
                      {expense.sharedWith?.length ? (
                        <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-lg font-medium flex-shrink-0" style={{ background: '#06b6d420', color: '#06b6d4', fontSize: 10 }}>
                          <Users size={9} /> ÷
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {cat?.name} · {formatDate(expense.date)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {expense.sharedWith?.length ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>minha parte</p>
                    ) : null}
                    <p className="text-sm font-bold">{formatCurrency(getEffectiveAmount(expense))}</p>
                    {expense.sharedWith?.length && getEffectiveAmount(expense) !== expense.amount ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>de {formatCurrency(expense.amount)}</p>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
