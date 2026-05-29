'use client'

import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { formatCurrency } from '@/lib/weekHelpers'
import { FixedExpense, PaymentMethod } from '@/types'

// ── constants ─────────────────────────────────────────────────────────────────

const QUICK_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#64748b']

// ── helpers ──────────────────────────────────────────────────────────────────

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'credit_card', label: 'Cartão', icon: '💳' },
  { value: 'pix', label: 'Pix', icon: '⚡' },
  { value: 'ted', label: 'TED', icon: '🏦' },
  { value: 'cash', label: 'Dinheiro', icon: '💵' },
]

function currentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return m === 12
    ? `${y + 1}-01`
    : `${y}-${String(m + 1).padStart(2, '0')}`
}

function monthsSince(createdAt: string): string[] {
  const start = createdAt.slice(0, 7)
  const now = currentMonthKey()
  const months: string[] = []
  let cur = start
  while (cur <= now) {
    months.push(cur)
    cur = nextMonth(cur)
  }
  return months
}

// ── form state ────────────────────────────────────────────────────────────────

interface TemplateForm {
  description: string
  suggestedAmount: string
  categoryId: string
  establishmentId: string
  paymentMethod: PaymentMethod
  notes: string
  isActive: boolean
  dueDateDay: string        // '' | '1'–'31'
  reminderEnabled: boolean
}

const defaultTemplateForm: TemplateForm = {
  description: '',
  suggestedAmount: '',
  categoryId: '',
  establishmentId: '',
  paymentMethod: 'pix',
  notes: '',
  isActive: true,
  dueDateDay: '',
  reminderEnabled: false,
}

// ── component ─────────────────────────────────────────────────────────────────

export default function FixedExpensesPage() {
  const {
    fixedExpenses, fixedExpenseMonths, categories, establishments, preferences,
    addFixedExpense, updateFixedExpense, deleteFixedExpense,
    addFixedExpenseMonth, updateFixedExpenseMonth, deleteFixedExpenseMonth,
    addCategory, addEstablishment,
  } = useAppStore()

  // template form state
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<FixedExpense | null>(null)
  const [templateForm, setTemplateForm] = useState<TemplateForm>(defaultTemplateForm)
  const [templateSuccess, setTemplateSuccess] = useState('')
  const templateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // monthly register state
  const [registerTarget, setRegisterTarget] = useState<{ fe: FixedExpense; month: string; existingId?: string; existingAmount?: number } | null>(null)
  const [registerAmount, setRegisterAmount] = useState('')

  // expanded template history
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // quick-add category
  const [showQuickCat, setShowQuickCat] = useState(false)
  const [quickCatName, setQuickCatName] = useState('')
  const [quickCatColor, setQuickCatColor] = useState(QUICK_COLORS[0])

  // quick-add establishment
  const [showQuickEst, setShowQuickEst] = useState(false)
  const [quickEstName, setQuickEstName] = useState('')
  const [quickEstCategoryId, setQuickEstCategoryId] = useState('')

  const formRef = useRef<HTMLDivElement>(null)
  const descInputRef = useRef<HTMLInputElement>(null)
  const registerInputRef = useRef<HTMLInputElement>(null)

  // ── computed ────────────────────────────────────────────────────────────────

  const pending = useMemo(() => {
    const result: { fe: FixedExpense; month: string }[] = []
    for (const fe of fixedExpenses.filter((fe) => fe.isActive)) {
      for (const month of monthsSince(fe.createdAt)) {
        const registered = fixedExpenseMonths.some(
          (fem) => fem.fixedExpenseId === fe.id && fem.month === month
        )
        if (!registered) result.push({ fe, month })
      }
    }
    return result
  }, [fixedExpenses, fixedExpenseMonths])

  // ── template form handlers ──────────────────────────────────────────────────

  const focusTemplateForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      descInputRef.current?.focus()
    }, 120)
  }

  const openNewTemplate = () => {
    setEditingTemplate(null)
    setTemplateForm(defaultTemplateForm)
    setTemplateSuccess('')
    setShowTemplateForm(true)
    focusTemplateForm()
  }

  const openEditTemplate = (fe: FixedExpense) => {
    setEditingTemplate(fe)
    setTemplateForm({
      description: fe.description,
      suggestedAmount: String(fe.suggestedAmount),
      categoryId: fe.categoryId,
      establishmentId: fe.establishmentId ?? '',
      paymentMethod: fe.paymentMethod,
      notes: fe.notes ?? '',
      isActive: fe.isActive,
      dueDateDay: fe.dueDateDay ? String(fe.dueDateDay) : '',
      reminderEnabled: fe.reminderEnabled ?? false,
    })
    setTemplateSuccess('')
    setShowTemplateForm(true)
    focusTemplateForm()
  }

  const saveTemplate = () => {
    if (!templateForm.description.trim() || !templateForm.categoryId) return
    const suggestedAmount = parseFloat(templateForm.suggestedAmount) || 0
    const dueDateDay = templateForm.dueDateDay ? parseInt(templateForm.dueDateDay) : undefined
    const data = {
      description: templateForm.description.trim(),
      suggestedAmount,
      categoryId: templateForm.categoryId,
      establishmentId: templateForm.establishmentId || undefined,
      paymentMethod: templateForm.paymentMethod,
      notes: templateForm.notes || undefined,
      isActive: templateForm.isActive,
      dueDateDay,
      reminderEnabled: dueDateDay ? templateForm.reminderEnabled : false,
    }
    if (editingTemplate) {
      updateFixedExpense(editingTemplate.id, data)
      setShowTemplateForm(false)
    } else {
      addFixedExpense(data)
      if (templateTimerRef.current) clearTimeout(templateTimerRef.current)
      setTemplateSuccess(`"${data.description}" criada!`)
      templateTimerRef.current = setTimeout(() => setTemplateSuccess(''), 3000)
      setTemplateForm(defaultTemplateForm)
    }
  }

  const toggleActive = (fe: FixedExpense) => updateFixedExpense(fe.id, { isActive: !fe.isActive })

  // ── monthly register handlers ───────────────────────────────────────────────

  const openRegister = (fe: FixedExpense, month: string) => {
    const existing = fixedExpenseMonths.find(
      (fem) => fem.fixedExpenseId === fe.id && fem.month === month
    )
    setRegisterTarget({ fe, month, existingId: existing?.id, existingAmount: existing?.amount })
    setRegisterAmount(existing ? String(existing.amount) : String(fe.suggestedAmount || ''))
    setTimeout(() => registerInputRef.current?.focus(), 80)
  }

  const confirmRegister = () => {
    if (!registerTarget) return
    const amount = parseFloat(registerAmount)
    if (isNaN(amount) || amount <= 0) return

    if (registerTarget.existingId) {
      updateFixedExpenseMonth(registerTarget.existingId, amount)
    } else {
      addFixedExpenseMonth({
        fixedExpenseId: registerTarget.fe.id,
        month: registerTarget.month,
        amount,
      })
    }
    setRegisterTarget(null)
  }

  // ── quick-add handlers ──────────────────────────────────────────────────────

  const handleQuickAddCat = () => {
    if (!quickCatName.trim()) return
    addCategory({ name: quickCatName.trim(), icon: 'MoreHorizontal', color: quickCatColor })
    const newCat = useAppStore.getState().categories.find((c) => c.name === quickCatName.trim())
    if (newCat) setTemplateForm((f) => ({ ...f, categoryId: newCat.id }))
    setQuickCatName('')
    setShowQuickCat(false)
  }

  const handleQuickAddEst = () => {
    if (!quickEstName.trim() || !quickEstCategoryId) return
    addEstablishment({ name: quickEstName.trim(), categoryId: quickEstCategoryId })
    const newEst = useAppStore.getState().establishments.find((e) => e.name === quickEstName.trim())
    if (newEst) setTemplateForm((f) => ({ ...f, establishmentId: newEst.id }))
    setQuickEstName('')
    setShowQuickEst(false)
  }

  // ── render helpers ──────────────────────────────────────────────────────────

  const getCat = (id: string) => categories.find((c) => c.id === id)

  const getMonthsForFe = (feId: string) =>
    fixedExpenseMonths
      .filter((fem) => fem.fixedExpenseId === feId)
      .sort((a, b) => b.month.localeCompare(a.month))

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Despesas Fixas</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {fixedExpenses.filter((fe) => fe.isActive).length} ativas
            {pending.length > 0 && ` · ${pending.length} pendente${pending.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={openNewTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
        >
          <Plus size={15} /> Nova
        </button>
      </div>

      {/* ── Pending section ── */}
      {pending.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Pendentes de registro
          </p>
          <div className="space-y-2">
            {pending.map(({ fe, month }) => {
              const cat = getCat(fe.categoryId)
              return (
                <motion.div
                  key={`${fe.id}-${month}`}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border"
                  style={{ background: 'var(--bg-card)', borderColor: 'rgba(245,158,11,0.4)' }}
                >
                  {cat && (
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cat.color + '20' }}
                    >
                      <CategoryIcon name={cat.icon} size={16} style={{ color: cat.color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fe.description}</p>
                    <p className="text-xs" style={{ color: '#f59e0b' }}>
                      {formatMonth(month)}
                      {fe.suggestedAmount > 0 && ` · sugerido ${formatCurrency(fe.suggestedAmount)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => openRegister(fe, month)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
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

      {/* ── Monthly register modal ── */}
      <AnimatePresence>
        {registerTarget && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRegisterTarget(null)}
            />
            <motion.div
              className="fixed z-50 left-4 right-4 lg:left-auto lg:right-auto lg:w-96"
              style={{ top: '50%', transform: 'translateY(-50%)', margin: '0 auto', maxWidth: 400, left: '50%', translate: '-50% -50%' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div
                className="p-6 rounded-3xl space-y-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{registerTarget.fe.description}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatMonth(registerTarget.month)}
                    </p>
                  </div>
                  <button
                    onClick={() => setRegisterTarget(null)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Valor deste mês (R$)
                  </label>
                  <input
                    ref={registerInputRef}
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={registerAmount}
                    onChange={(e) => setRegisterAmount(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') confirmRegister() }}
                    className="w-full px-4 py-3 rounded-2xl border outline-none text-2xl font-bold"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  {registerAmount && parseFloat(registerAmount) > 0 && (
                    <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--accent)' }}>
                      = {formatCurrency(Math.round(parseFloat(registerAmount) / 4 * 100) / 100)}/semana
                      {' '}— lançado nas segundas-feiras de {formatMonth(registerTarget.month)}
                    </p>
                  )}
                </div>

                {registerTarget.existingId && (
                  <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                    Este mês já tem um valor registrado. Confirmar irá atualizar os lançamentos.
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setRegisterTarget(null)}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-medium"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmRegister}
                    disabled={!registerAmount || parseFloat(registerAmount) <= 0}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Templates list ── */}
      {fixedExpenses.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-3xl mb-3">🔁</p>
          <p className="text-sm font-medium">Nenhuma despesa fixa cadastrada</p>
          <p className="text-xs mt-1">Aluguel, academia, assinaturas...</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {fixedExpenses.map((fe) => {
            const cat = getCat(fe.categoryId)
            const months = getMonthsForFe(fe.id)
            const isExpanded = expandedId === fe.id
            const isDeleting = deleteConfirm === fe.id

            return (
              <motion.div
                key={fe.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  opacity: fe.isActive ? 1 : 0.6,
                }}
              >
                {/* Main row */}
                <div className="flex items-start gap-3 p-3.5">
                  {cat && (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cat.color + '20' }}
                    >
                      <CategoryIcon name={cat.icon} size={18} style={{ color: cat.color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm">{fe.description}</p>
                      {fe.reminderEnabled && <span className="text-sm">🔔</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {cat && (
                        <span className="text-xs px-1.5 py-0.5 rounded-lg font-medium"
                          style={{ background: cat.color + '20', color: cat.color }}>
                          {cat.name}
                        </span>
                      )}
                      {fe.dueDateDay && (
                        <span className="text-xs px-1.5 py-0.5 rounded-lg font-medium"
                          style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                          Vence dia {fe.dueDateDay}
                        </span>
                      )}
                      {fe.suggestedAmount > 0 && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Sugerido: {formatCurrency(fe.suggestedAmount)}/mês
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : fe.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Expanded: history */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="px-3.5 pb-3 space-y-1.5" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          Histórico de meses
                        </p>
                        {months.length === 0 ? (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nenhum mês registrado ainda.</p>
                        ) : (
                          months.map((fem) => (
                            <div key={fem.id} className="flex items-center justify-between gap-2">
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {formatMonth(fem.month)}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{formatCurrency(fem.amount)}</span>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  ({formatCurrency(Math.round(fem.amount / 4 * 100) / 100)}/sem)
                                </span>
                                <button
                                  onClick={() => openRegister(fe, fem.month)}
                                  className="text-xs px-2 py-0.5 rounded-lg"
                                  style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => deleteFixedExpenseMonth(fem.id)}
                                  className="text-xs px-2 py-0.5 rounded-lg"
                                  style={{ background: '#ef444420', color: '#ef4444' }}
                                >
                                  Excluir
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                        {/* Register new month (months not yet registered) */}
                        {monthsSince(fe.createdAt)
                          .filter((m) => !fixedExpenseMonths.some((fem) => fem.fixedExpenseId === fe.id && fem.month === m))
                          .map((m) => (
                            <div key={m} className="flex items-center justify-between gap-2">
                              <span className="text-xs" style={{ color: '#f59e0b' }}>{formatMonth(m)}</span>
                              <button
                                onClick={() => openRegister(fe, m)}
                                className="text-xs px-2 py-0.5 rounded-lg font-medium"
                                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
                              >
                                Registrar
                              </button>
                            </div>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions row */}
                {isDeleting ? (
                  <div className="flex items-center gap-2 px-3.5 pb-3.5 pt-1">
                    <p className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>
                      Excluir template e todos os lançamentos?
                    </p>
                    <button onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                      Cancelar
                    </button>
                    <button onClick={() => { deleteFixedExpense(fe.id); setDeleteConfirm(null) }}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: '#ef444420', color: '#ef4444' }}>
                      Excluir
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3.5 pb-3.5 pt-1">
                    <button onClick={() => toggleActive(fe)}
                      className="flex items-center gap-2 text-xs font-medium"
                      style={{ color: fe.isActive ? 'var(--accent)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <div style={{
                        width: 36, height: 20, borderRadius: 10,
                        background: fe.isActive ? 'var(--accent)' : 'var(--border)',
                        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                      }}>
                        <div style={{
                          width: 14, height: 14, borderRadius: '50%', background: '#fff',
                          position: 'absolute', top: 3, left: fe.isActive ? 19 : 3,
                          transition: 'left 0.2s',
                        }} />
                      </div>
                      {fe.isActive ? 'Ativa' : 'Inativa'}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEditTemplate(fe)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                        <Pencil size={12} /> Editar
                      </button>
                      <button onClick={() => setDeleteConfirm(fe.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                        style={{ background: '#ef444420', color: '#ef4444' }}>
                        <Trash2 size={12} /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Template form (bottom sheet / inline) ── */}
      <AnimatePresence>
        {showTemplateForm && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTemplateForm(false)}
            />
            <motion.div
              ref={formRef}
              className="fixed lg:relative bottom-0 lg:bottom-auto left-0 lg:left-auto right-0 lg:right-auto z-50 lg:z-auto
                         rounded-t-3xl lg:rounded-2xl border-t lg:border mt-4"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', maxHeight: 'calc(92vh - env(safe-area-inset-bottom))', overflowY: 'auto' }}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="lg:hidden flex justify-center pt-3">
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-hover)' }} />
              </div>
              <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {editingTemplate ? 'Editar despesa fixa' : 'Nova despesa fixa'}
                </h2>
                <button onClick={() => setShowTemplateForm(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                  <X size={15} />
                </button>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Descrição
                </label>
                <input
                  ref={descInputRef}
                  type="text"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Ex: Aluguel, Netflix, Academia..."
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Suggested amount */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Valor sugerido por mês (R$) — opcional
                </label>
                <input
                  type="number" step="0.01" min="0"
                  value={templateForm.suggestedAmount}
                  onChange={(e) => setTemplateForm({ ...templateForm, suggestedAmount: e.target.value })}
                  placeholder="0,00"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-2xl font-bold"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Pré-preenchido ao registrar cada mês. Pode ser alterado.
                </p>
              </div>

              {/* Due date day */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Dia de vencimento — opcional
                </label>
                <select
                  value={templateForm.dueDateDay}
                  onChange={(e) => setTemplateForm({ ...templateForm, dueDateDay: e.target.value, reminderEnabled: e.target.value ? templateForm.reminderEnabled : false })}
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <option value="">Sem vencimento definido</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={String(d)}>Todo dia {d}</option>
                  ))}
                </select>
              </div>

              {/* WhatsApp reminder toggle */}
              {templateForm.dueDateDay && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl" style={{ background: 'var(--bg-input)' }}>
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-medium">Lembrete via WhatsApp</p>
                    {preferences.whatsappNumber ? (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Aviso 1 dia antes e no dia do vencimento
                      </p>
                    ) : (
                      <p className="text-xs mt-0.5" style={{ color: '#f59e0b' }}>
                        Configure seu número em Preferências para ativar
                      </p>
                    )}
                  </div>
                  {preferences.whatsappNumber ? (
                    <button
                      type="button"
                      onClick={() => setTemplateForm({ ...templateForm, reminderEnabled: !templateForm.reminderEnabled })}
                      style={{
                        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                        background: templateForm.reminderEnabled ? 'var(--accent)' : 'var(--border)',
                        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 3, left: templateForm.reminderEnabled ? 23 : 3,
                        transition: 'left 0.2s',
                      }} />
                    </button>
                  ) : (
                    <span className="text-lg">🔕</span>
                  )}
                </div>
              )}

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Categoria</label>
                  <button type="button"
                    onClick={() => { setShowQuickCat((v) => !v); setQuickCatName(''); setQuickCatColor(QUICK_COLORS[0]) }}
                    style={{ color: 'var(--accent)', background: 'var(--accent-light)', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Plus size={10} /> Nova categoria
                  </button>
                </div>
                <select
                  value={templateForm.categoryId}
                  onChange={(e) => setTemplateForm({ ...templateForm, categoryId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <AnimatePresence>
                  {showQuickCat && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 16, padding: 12, marginTop: 8 }} className="space-y-2">
                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Nova categoria</p>
                        <input
                          type="text" value={quickCatName}
                          onChange={(e) => setQuickCatName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickAddCat() } }}
                          placeholder="Nome da categoria" autoFocus
                          className="w-full px-3 py-2 rounded-xl border outline-none text-sm"
                          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5 flex-1 flex-wrap">
                            {QUICK_COLORS.map((color) => (
                              <button key={color} type="button" onClick={() => setQuickCatColor(color)}
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: color, border: quickCatColor === color ? '2px solid var(--text)' : '2px solid transparent' }}>
                                {quickCatColor === color && <Check size={11} color="#fff" strokeWidth={3} />}
                              </button>
                            ))}
                          </div>
                          <button type="button" onClick={handleQuickAddCat} disabled={!quickCatName.trim()}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white flex-shrink-0"
                            style={{ background: quickCatName.trim() ? 'var(--accent)' : 'var(--border)', cursor: quickCatName.trim() ? 'pointer' : 'default' }}>
                            <Check size={12} /> Criar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Establishment */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Estabelecimento (opcional)</label>
                  <button type="button"
                    onClick={() => { setShowQuickEst((v) => !v); setQuickEstName(''); setQuickEstCategoryId(categories[0]?.id ?? '') }}
                    style={{ color: 'var(--accent)', background: 'var(--accent-light)', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Plus size={10} /> Novo local
                  </button>
                </div>
                <select
                  value={templateForm.establishmentId}
                  onChange={(e) => setTemplateForm({ ...templateForm, establishmentId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <option value="">Nenhum</option>
                  {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <AnimatePresence>
                  {showQuickEst && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 16, padding: 12, marginTop: 8 }} className="space-y-2">
                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Novo estabelecimento</p>
                        <input
                          type="text" value={quickEstName}
                          onChange={(e) => setQuickEstName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickAddEst() } }}
                          placeholder="Nome do local" autoFocus
                          className="w-full px-3 py-2 rounded-xl border outline-none text-sm"
                          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        />
                        <select
                          value={quickEstCategoryId}
                          onChange={(e) => setQuickEstCategoryId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border outline-none text-sm"
                          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        >
                          <option value="">Categoria padrão</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setShowQuickEst(false)}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium"
                            style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                            Cancelar
                          </button>
                          <button type="button" onClick={handleQuickAddEst} disabled={!quickEstName.trim() || !quickEstCategoryId}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
                            style={{ background: quickEstName.trim() && quickEstCategoryId ? 'var(--accent)' : 'var(--border)', cursor: quickEstName.trim() && quickEstCategoryId ? 'pointer' : 'default' }}>
                            <Check size={11} /> Criar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Meio de pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(({ value, label, icon }) => (
                    <button key={value} type="button"
                      onClick={() => setTemplateForm({ ...templateForm, paymentMethod: value })}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium"
                      style={{
                        borderColor: templateForm.paymentMethod === value ? 'var(--accent)' : 'var(--border)',
                        background: templateForm.paymentMethod === value ? 'var(--accent-light)' : 'var(--bg-input)',
                        color: templateForm.paymentMethod === value ? 'var(--accent)' : 'var(--text-muted)',
                      }}>
                      <span>{icon}</span> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active toggle (edit only) */}
              {editingTemplate && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {templateForm.isActive ? 'Gerando pendências todo mês' : 'Pausada'}
                    </p>
                  </div>
                  <button type="button"
                    onClick={() => setTemplateForm({ ...templateForm, isActive: !templateForm.isActive })}
                    style={{
                      width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                      background: templateForm.isActive ? 'var(--accent)' : 'var(--border)',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                    }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3, left: templateForm.isActive ? 23 : 3,
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={templateForm.notes}
                  onChange={(e) => setTemplateForm({ ...templateForm, notes: e.target.value })}
                  placeholder="Observações..."
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              {templateSuccess && (
                <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>✓ {templateSuccess}</p>
              )}

              <button
                onClick={saveTemplate}
                disabled={!templateForm.description.trim() || !templateForm.categoryId}
                className="w-full py-3 rounded-2xl text-white font-medium text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
              >
                {editingTemplate ? 'Salvar alterações' : 'Criar template'}
              </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
