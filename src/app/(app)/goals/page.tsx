'use client'

import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, Check, Trophy } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Money } from '@/components/ui/Money'
import { CenteredModal } from '@/components/ui/CenteredModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency, getWeeksUntilDeadline, getTodayKey } from '@/lib/weekHelpers'
import { FinancialGoal } from '@/types'

// ── constants ─────────────────────────────────────────────────────────────────

const QUICK_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#64748b']

const GOAL_ICONS = [
  'Target', 'Plane', 'Home', 'Car', 'Laptop', 'Smartphone', 'Coffee',
  'Gift', 'TrendingUp', 'ShoppingBag', 'Dumbbell', 'Heart',
  'Baby', 'Bike', 'Briefcase', 'BookOpen', 'Tv', 'Music',
]

// ── helpers ───────────────────────────────────────────────────────────────────

function currentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function formatDeadline(deadline: string): string {
  const [y, m] = deadline.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

// ── form state ────────────────────────────────────────────────────────────────

interface GoalForm {
  name: string
  targetAmount: string
  deadline: string       // YYYY-MM
  icon: string
  color: string
  notes: string
  weeklyAmount: string   // '' = auto
  deductFromBudget: boolean
  isActive: boolean
}

const defaultForm: GoalForm = {
  name: '',
  targetAmount: '',
  deadline: '',
  icon: 'Target',
  color: '#10b981',
  notes: '',
  weeklyAmount: '',
  deductFromBudget: false,
  isActive: true,
}

// ── component ─────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const {
    financialGoals,
    goalContributions,
    addFinancialGoal,
    updateFinancialGoal,
    deleteFinancialGoal,
    addGoalContribution,
    updateGoalContribution,
    deleteGoalContribution,
    getGoalProgress,
  } = useAppStore()

  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null)
  const [form, setForm] = useState<GoalForm>(defaultForm)
  const [successMsg, setSuccessMsg] = useState('')
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [contributeTarget, setContributeTarget] = useState<{ goal: FinancialGoal; month: string; existingId?: string } | null>(null)
  const [contributeAmount, setContributeAmount] = useState('')

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  const formRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const contributeInputRef = useRef<HTMLInputElement>(null)

  // ── computed ────────────────────────────────────────────────────────────────

  const currentMonth = currentMonthKey()

  const activeGoals = useMemo(
    () => financialGoals.filter(g => g.isActive && !g.completedAt),
    [financialGoals]
  )

  const inactiveGoals = useMemo(
    () => financialGoals.filter(g => !g.isActive || g.completedAt),
    [financialGoals]
  )

  const pendingGoals = useMemo(
    () => activeGoals.filter(g =>
      !goalContributions.some(c => c.goalId === g.id && c.month === currentMonth)
    ),
    [activeGoals, goalContributions, currentMonth]
  )

  // preview calculation inside form
  const formWeeklyPreview = useMemo(() => {
    if (!form.deadline) return null
    const target = parseFloat(form.targetAmount) || 0
    if (target <= 0) return null
    const weeksLeft = getWeeksUntilDeadline(form.deadline)
    if (form.weeklyAmount) {
      const manual = parseFloat(form.weeklyAmount) || 0
      return { weekly: manual, weeksLeft }
    }
    return { weekly: Math.ceil((target / weeksLeft) * 100) / 100, weeksLeft }
  }, [form.deadline, form.targetAmount, form.weeklyAmount])

  // ── form handlers ────────────────────────────────────────────────────────────

  const focusForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      nameInputRef.current?.focus()
    }, 120)
  }

  const openNew = () => {
    setEditingGoal(null)
    setForm(defaultForm)
    setSuccessMsg('')
    setShowForm(true)
    focusForm()
  }

  const openEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal)
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      deadline: goal.deadline,
      icon: goal.icon,
      color: goal.color,
      notes: goal.notes ?? '',
      weeklyAmount: goal.weeklyAmount ? String(goal.weeklyAmount) : '',
      deductFromBudget: goal.deductFromBudget,
      isActive: goal.isActive,
    })
    setSuccessMsg('')
    setShowForm(true)
    focusForm()
  }

  const saveGoal = () => {
    if (!form.name.trim() || !form.deadline) return
    const targetAmount = parseFloat(form.targetAmount) || 0
    if (targetAmount <= 0) return
    const data = {
      name: form.name.trim(),
      targetAmount,
      deadline: form.deadline,
      icon: form.icon,
      color: form.color,
      notes: form.notes || undefined,
      weeklyAmount: form.weeklyAmount ? parseFloat(form.weeklyAmount) : undefined,
      deductFromBudget: form.deductFromBudget,
      isActive: form.isActive,
    }
    if (editingGoal) {
      updateFinancialGoal(editingGoal.id, data)
      setShowForm(false)
    } else {
      addFinancialGoal(data)
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
      setSuccessMsg(`"${data.name}" criada!`)
      successTimerRef.current = setTimeout(() => setSuccessMsg(''), 3000)
      setForm(defaultForm)
    }
  }

  // ── contribution handlers ────────────────────────────────────────────────────

  const openContribute = (goal: FinancialGoal) => {
    const existing = goalContributions.find(c => c.goalId === goal.id && c.month === currentMonth)
    setContributeTarget({ goal, month: currentMonth, existingId: existing?.id })
    const { effectiveWeekly } = getGoalProgress(goal.id)
    setContributeAmount(existing ? String(existing.amount) : String(Math.round(effectiveWeekly * 4 * 100) / 100 || ''))
    setTimeout(() => contributeInputRef.current?.focus(), 80)
  }

  const confirmContribute = () => {
    if (!contributeTarget) return
    const amount = parseFloat(contributeAmount)
    if (isNaN(amount) || amount <= 0) return
    if (contributeTarget.existingId) {
      updateGoalContribution(contributeTarget.existingId, amount)
    } else {
      addGoalContribution({ goalId: contributeTarget.goal.id, month: contributeTarget.month, amount })
    }
    setContributeTarget(null)
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Metas Financeiras</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {activeGoals.length} {activeGoals.length === 1 ? 'ativa' : 'ativas'}
            {pendingGoals.length > 0 && ` · ${pendingGoals.length} pendente${pendingGoals.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
        >
          <Plus size={15} /> Nova
        </button>
      </div>

      {/* ── Inline form (lg) / bottom sheet (mobile) ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            ref={formRef}
            key="goal-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm">{editingGoal ? 'Editar meta' : 'Nova meta'}</span>
              <button onClick={() => setShowForm(false)}>
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Name */}
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Nome da meta"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />

              {/* Target amount + deadline */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Valor alvo</label>
                  <input
                    type="number"
                    placeholder="R$ 0"
                    value={form.targetAmount}
                    onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Prazo</label>
                  <input
                    type="month"
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              {/* Weekly preview */}
              {formWeeklyPreview && (
                <div
                  className="px-3 py-2 rounded-xl text-xs"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
                >
                  Guardar <strong><Money value={`${formatCurrency(formWeeklyPreview.weekly)}/semana`} /></strong> por {formWeeklyPreview.weeksLeft} semana{formWeeklyPreview.weeksLeft > 1 ? 's' : ''} até {formatDeadline(form.deadline)}
                </div>
              )}

              {/* Icon picker */}
              <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>Ícone</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setForm(f => ({ ...f, icon }))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: form.icon === icon ? form.color : 'var(--bg-input)',
                        border: `2px solid ${form.icon === icon ? form.color : 'transparent'}`,
                      }}
                    >
                      <CategoryIcon name={icon} size={16} color={form.icon === icon ? '#fff' : 'var(--text-muted)'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>Cor</label>
                <div className="flex gap-2">
                  {QUICK_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full"
                      style={{
                        background: c,
                        outline: form.color === c ? `2px solid ${c}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Weekly amount override */}
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Valor semanal fixo (opcional)</label>
                <input
                  type="number"
                  placeholder="Automático"
                  value={form.weeklyAmount}
                  onChange={e => setForm(f => ({ ...f, weeklyAmount: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Notes */}
              <input
                type="text"
                placeholder="Observações (opcional)"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />

              {/* Toggles */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Deduzir do orçamento semanal</span>
                  <button
                    onClick={() => setForm(f => ({ ...f, deductFromBudget: !f.deductFromBudget }))}
                    className="w-11 h-6 rounded-full transition-colors relative"
                    style={{ background: form.deductFromBudget ? '#10b981' : 'var(--bg-input)' }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                      style={{ left: form.deductFromBudget ? '22px' : '2px' }}
                    />
                  </button>
                </label>
                {editingGoal && (
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Meta ativa</span>
                    <button
                      onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                      className="w-11 h-6 rounded-full transition-colors relative"
                      style={{ background: form.isActive ? '#10b981' : 'var(--bg-input)' }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                        style={{ left: form.isActive ? '22px' : '2px' }}
                      />
                    </button>
                  </label>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveGoal}
                  disabled={!form.name.trim() || !form.deadline || !(parseFloat(form.targetAmount) > 0)}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                >
                  {editingGoal ? 'Salvar' : 'Criar meta'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success message */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 px-4 py-2.5 rounded-2xl text-sm flex items-center gap-2"
            style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}
          >
            <Check size={14} /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pending section ── */}
      {pendingGoals.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Registrar contribuição — {formatMonth(currentMonth)}
          </p>
          <div className="space-y-2">
            {pendingGoals.map(goal => {
              const { effectiveWeekly, percentage } = getGoalProgress(goal.id)
              const suggested = Math.round(effectiveWeekly * 4 * 100) / 100
              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border"
                  style={{ background: 'var(--bg-card)', borderColor: 'rgba(245,158,11,0.4)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${goal.color}22` }}
                  >
                    <CategoryIcon name={goal.icon} size={16} color={goal.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{goal.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {percentage}% atingido · sugestão <Money value={`${formatCurrency(suggested)}/mês`} />
                    </div>
                  </div>
                  <button
                    onClick={() => openContribute(goal)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-white flex-shrink-0"
                    style={{ background: '#f59e0b' }}
                  >
                    Registrar
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Active goals ── */}
      {activeGoals.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Metas ativas
          </p>
          <div className="space-y-3">
            {activeGoals.map(goal => {
              const { contributed, remaining, effectiveWeekly, percentage, weeksLeft } = getGoalProgress(goal.id)
              const hasContribMonth = goalContributions.some(c => c.goalId === goal.id && c.month === currentMonth)
              const history = goalContributions.filter(c => c.goalId === goal.id).sort((a, b) => b.month.localeCompare(a.month))
              const isExpanded = expandedId === goal.id

              return (
                <motion.div
                  key={goal.id}
                  layout
                  className="rounded-2xl border overflow-hidden"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  {/* Card main row */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${goal.color}22` }}
                      >
                        <CategoryIcon name={goal.icon} size={18} color={goal.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{goal.name}</span>
                          {goal.deductFromBudget && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-md"
                              style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}
                            >
                              Deduz orçamento
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          Prazo: {formatDeadline(goal.deadline)} · {weeksLeft} semana{weeksLeft > 1 ? 's' : ''} restante{weeksLeft > 1 ? 's' : ''}
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2.5 mb-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span style={{ color: 'var(--text-muted)' }}><Money value={formatCurrency(contributed)} /> guardados</span>
                            <span style={{ color: 'var(--text-muted)' }}>de <Money value={formatCurrency(goal.targetAmount)} /></span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{ background: goal.color }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium" style={{ color: goal.color }}>
                            {percentage}% · guardar <Money value={`${formatCurrency(effectiveWeekly)}/semana`} />
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            faltam <Money value={formatCurrency(remaining)} />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      <button
                        onClick={() => openContribute(goal)}
                        className="flex-1 py-1.5 rounded-xl text-xs font-medium text-white"
                        style={{ background: hasContribMonth ? 'var(--bg-input)' : 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                      >
                        {hasContribMonth ? '✓ Registrado este mês' : 'Registrar contribuição'}
                      </button>
                      <button
                        onClick={() => openEdit(goal)}
                        aria-label={`Editar meta ${goal.name}`}
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--bg-input)' }}
                      >
                        <Pencil size={13} style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <button
                        onClick={() => updateFinancialGoal(goal.id, { completedAt: getTodayKey() })}
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--bg-input)' }}
                        title="Marcar como concluída"
                        aria-label={`Marcar meta ${goal.name} como concluída`}
                      >
                        <Trophy size={13} style={{ color: '#f59e0b' }} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(goal.id)}
                        aria-label={`Excluir meta ${goal.name}`}
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--bg-input)' }}
                      >
                        <Trash2 size={13} style={{ color: 'var(--red)' }} />
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--bg-input)' }}
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* History */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <div className="p-4 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                            Histórico de contribuições
                          </p>
                          {history.length === 0 ? (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nenhuma contribuição registrada.</p>
                          ) : (
                            history.map(c => (
                              <div key={c.id} className="flex items-center justify-between">
                                <span className="text-sm">{formatMonth(c.month)}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium"><Money value={formatCurrency(c.amount)} /></span>
                                  <button
                                    onClick={() => deleteGoalContribution(c.id)}
                                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                                    style={{ background: 'var(--bg-input)' }}
                                  >
                                    <X size={10} style={{ color: 'var(--red)' }} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {activeGoals.length === 0 && !showForm && (
        <div
          className="text-center py-12 rounded-2xl"
          style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}
        >
          <CategoryIcon name="Target" size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p className="text-sm font-medium mb-1">Nenhuma meta criada</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Defina objetivos e acompanhe seu progresso</p>
          <button
            onClick={openNew}
            className="px-4 py-2 rounded-xl text-sm text-white font-medium"
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
          >
            Criar primeira meta
          </button>
        </div>
      )}

      {/* ── Completed / inactive goals ── */}
      {inactiveGoals.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            {showCompleted ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Concluídas / pausadas ({inactiveGoals.length})
          </button>
          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {inactiveGoals.map(goal => {
                  const { percentage } = getGoalProgress(goal.id)
                  return (
                    <div
                      key={goal.id}
                      className="flex items-center gap-3 p-3.5 rounded-2xl border"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', opacity: 0.65 }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${goal.color}22` }}
                      >
                        <CategoryIcon name={goal.icon} size={16} color={goal.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{goal.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {goal.completedAt ? '✓ Concluída' : 'Pausada'} · {percentage}% atingido
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {goal.completedAt && (
                          <button
                            onClick={() => updateFinancialGoal(goal.id, { completedAt: null as any, isActive: true })}
                            className="text-xs px-2 py-1 rounded-lg"
                            style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                          >
                            Reabrir
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(goal.id)}
                          aria-label={`Excluir meta ${goal.name}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--bg-input)' }}
                        >
                          <Trash2 size={12} style={{ color: 'var(--red)' }} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Contribution modal ── */}
      <CenteredModal open={!!contributeTarget} onClose={() => setContributeTarget(null)} maxWidth={384} mobileBottomSheet>
        {contributeTarget && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-sm">{contributeTarget.goal.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Contribuição de {formatMonth(contributeTarget.month)}
                </p>
              </div>
              <button onClick={() => setContributeTarget(null)}>
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Progress summary */}
            {(() => {
              const p = getGoalProgress(contributeTarget.goal.id)
              return (
                <div
                  className="px-3 py-2 rounded-xl text-xs mb-4"
                  style={{ background: 'var(--bg-input)' }}
                >
                  <div className="flex justify-between mb-1">
                    <span style={{ color: 'var(--text-muted)' }}>Guardado</span>
                    <span><Money value={`${formatCurrency(p.contributed)} / ${formatCurrency(contributeTarget.goal.targetAmount)}`} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Sugestão mensal</span>
                    <span style={{ color: '#10b981' }}><Money value={formatCurrency(Math.round(p.effectiveWeekly * 4 * 100) / 100)} /></span>
                  </div>
                </div>
              )
            })()}

            <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>
              Valor contribuído em {formatMonth(contributeTarget.month)}
            </label>
            <input
              ref={contributeInputRef}
              type="number"
              placeholder="R$ 0"
              value={contributeAmount}
              onChange={e => setContributeAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmContribute()}
              className="w-full px-3 py-2.5 rounded-xl text-sm mb-4"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-dm-mono)' }}
            />

            <div className="flex gap-2">
              <button
                onClick={confirmContribute}
                disabled={!(parseFloat(contributeAmount) > 0)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
              >
                {contributeTarget.existingId ? 'Atualizar' : 'Confirmar'}
              </button>
              <button
                onClick={() => setContributeTarget(null)}
                className="px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </CenteredModal>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir meta?"
        message="Todas as contribuições serão removidas."
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => { if (deleteConfirm) { deleteFinancialGoal(deleteConfirm); setDeleteConfirm(null) } }}
      />

    </div>
  )
}
