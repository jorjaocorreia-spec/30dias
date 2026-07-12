'use client'

import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Money } from '@/components/ui/Money'
import { formatCurrency } from '@/lib/weekHelpers'
import { IncomeSource, IncomeEntry, PaymentMethod } from '@/types'

// ── helpers ──────────────────────────────────────────────────────────────────

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'pix', label: 'Pix', icon: '⚡' },
  { value: 'ted', label: 'TED', icon: '🏦' },
  { value: 'credit_card', label: 'Cartão', icon: '💳' },
  { value: 'cash', label: 'Dinheiro', icon: '💵' },
]

function currentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function formatMonthShort(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function prevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, '0')}`
}

function nextMonthKey(month: string): string {
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
    cur = nextMonthKey(cur)
  }
  return months
}

// ── form types ────────────────────────────────────────────────────────────────

interface SourceForm {
  description: string
  expectedAmount: string
  categoryId: string
  paymentMethod: PaymentMethod
  notes: string
  isActive: boolean
}

const defaultSourceForm: SourceForm = {
  description: '',
  expectedAmount: '',
  categoryId: '',
  paymentMethod: 'pix',
  notes: '',
  isActive: true,
}

type EntryMode = 'source' | 'adhoc'

interface EntryForm {
  mode: EntryMode
  incomeSourceId: string
  categoryId: string
  description: string
  amount: string
  receivedDate: string
  paymentMethod: PaymentMethod
  notes: string
}

// ── component ─────────────────────────────────────────────────────────────────

export default function IncomePage() {
  const {
    incomeCategories, incomeSources, incomeEntries,
    addIncomeSource, updateIncomeSource, deleteIncomeSource,
    addIncomeEntry, updateIncomeEntry, deleteIncomeEntry,
  } = useAppStore()

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey())

  // Source form state
  const [showSourceForm, setShowSourceForm] = useState(false)
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null)
  const [sourceForm, setSourceForm] = useState<SourceForm>(defaultSourceForm)
  const [sourceSuccess, setSourceSuccess] = useState('')
  const sourceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Entry modal state
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null)
  const [entryForm, setEntryForm] = useState<EntryForm>({
    mode: 'adhoc',
    incomeSourceId: '',
    categoryId: '',
    description: '',
    amount: '',
    receivedDate: '',
    paymentMethod: 'pix',
    notes: '',
  })

  // Register from source shortcut
  const [registerTarget, setRegisterTarget] = useState<{ source: IncomeSource; month: string } | null>(null)
  const [registerAmount, setRegisterAmount] = useState('')

  // Expanded sources
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const formRef = useRef<HTMLDivElement>(null)
  const descInputRef = useRef<HTMLInputElement>(null)
  const registerInputRef = useRef<HTMLInputElement>(null)
  const entryAmountRef = useRef<HTMLInputElement>(null)

  // ── computed ────────────────────────────────────────────────────────────────

  const monthEntries = useMemo(
    () => incomeEntries.filter((e) => e.month === selectedMonth),
    [incomeEntries, selectedMonth]
  )

  const monthTotal = useMemo(
    () => monthEntries.reduce((sum, e) => sum + e.amount, 0),
    [monthEntries]
  )

  const pendingSources = useMemo(() => {
    const result: { source: IncomeSource; month: string }[] = []
    for (const source of incomeSources.filter((s) => s.isActive)) {
      const registered = incomeEntries.some(
        (e) => e.incomeSourceId === source.id && e.month === selectedMonth
      )
      if (!registered) result.push({ source, month: selectedMonth })
    }
    return result
  }, [incomeSources, incomeEntries, selectedMonth])

  const getCat = (id: string) => incomeCategories.find((c) => c.id === id)
  const getSource = (id: string) => incomeSources.find((s) => s.id === id)

  // ── source form handlers ────────────────────────────────────────────────────

  const focusSourceForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      descInputRef.current?.focus()
    }, 120)
  }

  const openNewSource = () => {
    setEditingSource(null)
    setSourceForm(defaultSourceForm)
    setSourceSuccess('')
    setShowSourceForm(true)
    focusSourceForm()
  }

  const openEditSource = (source: IncomeSource) => {
    setEditingSource(source)
    setSourceForm({
      description: source.description,
      expectedAmount: String(source.expectedAmount),
      categoryId: source.categoryId,
      paymentMethod: source.paymentMethod,
      notes: source.notes ?? '',
      isActive: source.isActive,
    })
    setSourceSuccess('')
    setShowSourceForm(true)
    focusSourceForm()
  }

  const saveSource = () => {
    if (!sourceForm.description.trim() || !sourceForm.categoryId) return
    const data = {
      description: sourceForm.description.trim(),
      expectedAmount: parseFloat(sourceForm.expectedAmount) || 0,
      categoryId: sourceForm.categoryId,
      paymentMethod: sourceForm.paymentMethod,
      notes: sourceForm.notes || undefined,
      isActive: sourceForm.isActive,
    }
    if (editingSource) {
      updateIncomeSource(editingSource.id, data)
      setShowSourceForm(false)
    } else {
      addIncomeSource(data)
      if (sourceTimerRef.current) clearTimeout(sourceTimerRef.current)
      setSourceSuccess(`"${data.description}" criada!`)
      sourceTimerRef.current = setTimeout(() => setSourceSuccess(''), 3000)
      setSourceForm(defaultSourceForm)
    }
  }

  const toggleSourceActive = (source: IncomeSource) =>
    updateIncomeSource(source.id, { isActive: !source.isActive })

  // ── quick register from source ──────────────────────────────────────────────

  const openRegisterSource = (source: IncomeSource, month: string) => {
    setRegisterTarget({ source, month })
    setRegisterAmount(source.expectedAmount > 0 ? String(source.expectedAmount) : '')
    setTimeout(() => registerInputRef.current?.focus(), 80)
  }

  const confirmRegisterSource = () => {
    if (!registerTarget) return
    const amount = parseFloat(registerAmount)
    if (isNaN(amount) || amount <= 0) return
    const { source, month } = registerTarget
    addIncomeEntry({
      incomeSourceId: source.id,
      categoryId: source.categoryId,
      description: source.description,
      amount,
      month,
      paymentMethod: source.paymentMethod,
      notes: source.notes,
    })
    setRegisterTarget(null)
  }

  // ── entry modal handlers ────────────────────────────────────────────────────

  const openNewEntry = () => {
    setEditingEntry(null)
    setEntryForm({
      mode: 'adhoc',
      incomeSourceId: '',
      categoryId: '',
      description: '',
      amount: '',
      receivedDate: '',
      paymentMethod: 'pix',
      notes: '',
    })
    setShowEntryModal(true)
    setTimeout(() => entryAmountRef.current?.focus(), 80)
  }

  const openEditEntry = (entry: IncomeEntry) => {
    setEditingEntry(entry)
    setEntryForm({
      mode: entry.incomeSourceId ? 'source' : 'adhoc',
      incomeSourceId: entry.incomeSourceId ?? '',
      categoryId: entry.categoryId,
      description: entry.description,
      amount: String(entry.amount),
      receivedDate: entry.receivedDate ?? '',
      paymentMethod: entry.paymentMethod,
      notes: entry.notes ?? '',
    })
    setShowEntryModal(true)
  }

  const saveEntry = () => {
    const amount = parseFloat(entryForm.amount)
    if (!entryForm.description.trim() || !entryForm.categoryId || isNaN(amount) || amount <= 0) return

    const data: Omit<IncomeEntry, 'id'> = {
      incomeSourceId: entryForm.incomeSourceId || undefined,
      categoryId: entryForm.categoryId,
      description: entryForm.description.trim(),
      amount,
      month: selectedMonth,
      receivedDate: entryForm.receivedDate || undefined,
      paymentMethod: entryForm.paymentMethod,
      notes: entryForm.notes || undefined,
    }

    if (editingEntry) {
      updateIncomeEntry(editingEntry.id, data)
    } else {
      addIncomeEntry(data)
    }
    setShowEntryModal(false)
  }

  const handleSourceSelect = (sourceId: string) => {
    const source = getSource(sourceId)
    if (!source) {
      setEntryForm((f) => ({ ...f, incomeSourceId: '', categoryId: '', description: '', paymentMethod: 'pix' }))
      return
    }
    setEntryForm((f) => ({
      ...f,
      incomeSourceId: sourceId,
      categoryId: source.categoryId,
      description: source.description,
      paymentMethod: source.paymentMethod,
      amount: source.expectedAmount > 0 ? String(source.expectedAmount) : f.amount,
    }))
  }

  const entryFormValid =
    entryForm.description.trim() &&
    entryForm.categoryId &&
    parseFloat(entryForm.amount) > 0

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Receitas</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {incomeSources.filter((s) => s.isActive).length} fontes ativas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openNewSource}
            className="px-3 py-2 rounded-2xl text-sm font-medium"
            style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
          >
            + Fonte
          </button>
          <button
            onClick={openNewEntry}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
          >
            <Plus size={15} /> Avulsa
          </button>
        </div>
      </div>

      {/* Month selector */}
      <div
        className="flex items-center justify-between p-4 rounded-2xl mb-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setSelectedMonth(prevMonth(selectedMonth))}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="font-semibold text-sm capitalize">{formatMonth(selectedMonth)}</p>
          {monthTotal > 0 && (
            <p className="text-xs mt-0.5 font-bold" style={{ color: 'var(--accent)' }}>
              <Money value={formatCurrency(monthTotal)} />
            </p>
          )}
        </div>
        <button
          onClick={() => setSelectedMonth(nextMonthKey(selectedMonth))}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Pending sources for this month */}
      {pendingSources.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Fontes pendentes neste mês
          </p>
          <div className="space-y-2">
            {pendingSources.map(({ source, month }) => {
              const cat = getCat(source.categoryId)
              return (
                <motion.div
                  key={source.id}
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
                    <p className="text-sm font-medium truncate">{source.description}</p>
                    <p className="text-xs" style={{ color: '#f59e0b' }}>
                      {source.expectedAmount > 0 && `Esperado: ${formatCurrency(source.expectedAmount)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => openRegisterSource(source, month)}
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

      {/* Entries for selected month */}
      {monthEntries.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Registros de {formatMonthShort(selectedMonth)}
          </p>
          <div className="space-y-2">
            {monthEntries.map((entry) => {
              const cat = getCat(entry.categoryId)
              const source = entry.incomeSourceId ? getSource(entry.incomeSourceId) : null
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
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
                      <p className="text-sm font-medium truncate">{entry.description}</p>
                      {source && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-lg font-medium flex-shrink-0"
                          style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}
                        >
                          🔁 Fixo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {cat && (
                        <span className="text-xs" style={{ color: cat.color }}>{cat.name}</span>
                      )}
                      {entry.receivedDate && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          · {new Date(entry.receivedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
                      <Money value={formatCurrency(entry.amount)} />
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditEntry(entry)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => deleteIncomeEntry(entry.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--red-light)', color: 'var(--red)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {monthEntries.length === 0 && pendingSources.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <p className="text-3xl mb-3">💰</p>
          <p className="text-sm font-medium">Nenhuma receita em {formatMonthShort(selectedMonth)}</p>
          <p className="text-xs mt-1">Registre uma receita avulsa ou crie uma fonte recorrente</p>
        </div>
      )}

      {/* Income Sources section */}
      {incomeSources.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Fontes recorrentes
          </p>
          <div className="space-y-2">
            {incomeSources.map((source) => {
              const cat = getCat(source.categoryId)
              const isExpanded = expandedSourceId === source.id
              const isDeleting = deleteConfirm === source.id
              const sourceMonthEntries = incomeEntries
                .filter((e) => e.incomeSourceId === source.id)
                .sort((a, b) => b.month.localeCompare(a.month))

              return (
                <motion.div
                  key={source.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    opacity: source.isActive ? 1 : 0.6,
                  }}
                >
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
                      <p className="font-medium text-sm">{source.description}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {cat && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-lg font-medium"
                            style={{ background: cat.color + '20', color: cat.color }}
                          >
                            {cat.name}
                          </span>
                        )}
                        {source.expectedAmount > 0 && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Esperado: {formatCurrency(source.expectedAmount)}/mês
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedSourceId(isExpanded ? null : source.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="px-3.5 pb-3" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                            Histórico de registros
                          </p>
                          {sourceMonthEntries.length === 0 ? (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nenhum mês registrado ainda.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {sourceMonthEntries.map((e) => (
                                <div key={e.id} className="flex items-center justify-between gap-2">
                                  <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                                    {formatMonthShort(e.month)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                                      <Money value={formatCurrency(e.amount)} />
                                    </span>
                                    <button
                                      onClick={() => openEditEntry(e)}
                                      className="text-xs px-2 py-0.5 rounded-lg"
                                      style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => deleteIncomeEntry(e.id)}
                                      className="text-xs px-2 py-0.5 rounded-lg"
                                      style={{ background: 'var(--red-light)', color: 'var(--red)' }}
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isDeleting ? (
                    <div className="flex items-center gap-2 px-3.5 pb-3.5 pt-1">
                      <p className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>
                        Excluir fonte e todos os registros vinculados?
                      </p>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => { deleteIncomeSource(source.id); setDeleteConfirm(null) }}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium"
                        style={{ background: 'var(--red-light)', color: 'var(--red)' }}
                      >
                        Excluir
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3.5 pb-3.5 pt-1">
                      <button
                        onClick={() => toggleSourceActive(source)}
                        className="flex items-center gap-2 text-xs font-medium"
                        style={{ color: source.isActive ? 'var(--accent)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <div style={{
                          width: 36, height: 20, borderRadius: 10,
                          background: source.isActive ? 'var(--accent)' : 'var(--border)',
                          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                        }}>
                          <div style={{
                            width: 14, height: 14, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 3, left: source.isActive ? 19 : 3,
                            transition: 'left 0.2s',
                          }} />
                        </div>
                        {source.isActive ? 'Ativa' : 'Inativa'}
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditSource(source)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                          style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(source.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                          style={{ background: 'var(--red-light)', color: 'var(--red)' }}
                        >
                          <Trash2 size={12} /> Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Quick register from source modal ── */}
      <AnimatePresence>
        {registerTarget && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRegisterTarget(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            <motion.div
              className="w-full"
              style={{ maxWidth: 400, pointerEvents: 'auto' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div className="p-6 rounded-3xl space-y-4" style={{ background: 'var(--bg-modal)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{registerTarget.source.description}</p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
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
                    Valor recebido (R$)
                  </label>
                  <input
                    ref={registerInputRef}
                    type="number" step="0.01" min="0.01"
                    value={registerAmount}
                    onChange={(e) => setRegisterAmount(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') confirmRegisterSource() }}
                    className="w-full px-4 py-3 rounded-2xl border outline-none text-2xl font-bold"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRegisterTarget(null)}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-medium"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmRegisterSource}
                    disabled={!registerAmount || parseFloat(registerAmount) <= 0}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Entry modal (avulsa / from source) ── */}
      <AnimatePresence>
        {showEntryModal && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEntryModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pointer-events-none">
            <motion.div
              className="w-full overflow-y-auto"
              style={{ maxWidth: 440, maxHeight: 'calc(100vh - 48px)', pointerEvents: 'auto' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div className="p-6 rounded-3xl space-y-4" style={{ background: 'var(--bg-modal)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">
                    {editingEntry ? 'Editar receita' : 'Nova receita'}
                  </h2>
                  <button
                    onClick={() => setShowEntryModal(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Mode toggle — only for new entries */}
                {!editingEntry && incomeSources.length > 0 && (
                  <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {(['adhoc', 'source'] as EntryMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setEntryForm((f) => ({ ...f, mode: m, incomeSourceId: '', categoryId: '', description: '' }))}
                        className="flex-1 py-2 text-xs font-medium transition-colors"
                        style={{
                          background: entryForm.mode === m ? 'var(--accent)' : 'var(--bg-input)',
                          color: entryForm.mode === m ? '#fff' : 'var(--text-muted)',
                        }}
                      >
                        {m === 'adhoc' ? 'Avulsa' : 'De uma fonte'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Source selector */}
                {entryForm.mode === 'source' && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Fonte recorrente
                    </label>
                    <select
                      value={entryForm.incomeSourceId}
                      onChange={(e) => handleSourceSelect(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      <option value="">Selecione uma fonte</option>
                      {incomeSources.filter((s) => s.isActive).map((s) => (
                        <option key={s.id} value={s.id}>{s.description}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={entryForm.description}
                    onChange={(e) => setEntryForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Ex: Salário, Freela App..."
                    className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Valor (R$)
                  </label>
                  <input
                    ref={entryAmountRef}
                    type="number" step="0.01" min="0.01"
                    value={entryForm.amount}
                    onChange={(e) => setEntryForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0,00"
                    className="w-full px-4 py-3 rounded-2xl border outline-none text-2xl font-bold"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Categoria
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {incomeCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setEntryForm((f) => ({ ...f, categoryId: cat.id }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border"
                        style={{
                          borderColor: entryForm.categoryId === cat.id ? cat.color : 'var(--border)',
                          background: entryForm.categoryId === cat.id ? cat.color + '20' : 'var(--bg-input)',
                          color: entryForm.categoryId === cat.id ? cat.color : 'var(--text-muted)',
                        }}
                      >
                        <CategoryIcon name={cat.icon} size={12} />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Recebido via
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map(({ value, label, icon }) => (
                      <button
                        key={value}
                        onClick={() => setEntryForm((f) => ({ ...f, paymentMethod: value }))}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium"
                        style={{
                          borderColor: entryForm.paymentMethod === value ? 'var(--accent)' : 'var(--border)',
                          background: entryForm.paymentMethod === value ? 'var(--accent-light)' : 'var(--bg-input)',
                          color: entryForm.paymentMethod === value ? 'var(--accent)' : 'var(--text-muted)',
                        }}
                      >
                        <span>{icon}</span> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Received date */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Data de recebimento (opcional)
                  </label>
                  <input
                    type="date"
                    value={entryForm.receivedDate}
                    onChange={(e) => setEntryForm((f) => ({ ...f, receivedDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Notas (opcional)
                  </label>
                  <input
                    type="text"
                    value={entryForm.notes}
                    onChange={(e) => setEntryForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Observações..."
                    className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowEntryModal(false)}
                    className="flex-1 py-3 rounded-2xl text-sm font-medium"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEntry}
                    disabled={!entryFormValid}
                    className="flex-1 py-3 rounded-2xl text-white font-medium text-sm disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                  >
                    {editingEntry ? 'Salvar' : 'Registrar'}
                  </button>
                </div>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Source form (bottom sheet / inline) ── */}
      <AnimatePresence>
        {showSourceForm && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSourceForm(false)}
            />
            <motion.div
              ref={formRef}
              className="fixed lg:relative bottom-0 lg:bottom-auto left-0 lg:left-auto right-0 lg:right-auto
                         rounded-t-3xl lg:rounded-2xl border-t lg:border mt-4"
              style={{ background: 'var(--bg-modal)', borderColor: 'var(--border)', maxHeight: 'calc(92vh - env(safe-area-inset-bottom))', overflowY: 'auto', zIndex: 50 }}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="lg:hidden flex justify-center pt-3">
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-hover)' }} />
              </div>
              <div className="p-5 space-y-4" style={{ paddingBottom: 'calc(var(--bottomnav-h) + env(safe-area-inset-bottom))' }}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {editingSource ? 'Editar fonte' : 'Nova fonte recorrente'}
                </h2>
                <button
                  onClick={() => setShowSourceForm(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                >
                  <X size={15} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Descrição
                </label>
                <input
                  ref={descInputRef}
                  type="text"
                  value={sourceForm.description}
                  onChange={(e) => setSourceForm({ ...sourceForm, description: e.target.value })}
                  placeholder="Ex: Salário, Aluguel recebido..."
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Valor esperado por mês (R$) — opcional
                </label>
                <input
                  type="number" step="0.01" min="0"
                  value={sourceForm.expectedAmount}
                  onChange={(e) => setSourceForm({ ...sourceForm, expectedAmount: e.target.value })}
                  placeholder="0,00"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-2xl font-bold"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Pré-preenchido ao registrar. Pode ser alterado a cada mês.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Categoria
                </label>
                <select
                  value={sourceForm.categoryId}
                  onChange={(e) => setSourceForm({ ...sourceForm, categoryId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <option value="">Selecione uma categoria</option>
                  {incomeCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Recebido via
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(({ value, label, icon }) => (
                    <button key={value} type="button"
                      onClick={() => setSourceForm({ ...sourceForm, paymentMethod: value })}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium"
                      style={{
                        borderColor: sourceForm.paymentMethod === value ? 'var(--accent)' : 'var(--border)',
                        background: sourceForm.paymentMethod === value ? 'var(--accent-light)' : 'var(--bg-input)',
                        color: sourceForm.paymentMethod === value ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      <span>{icon}</span> {label}
                    </button>
                  ))}
                </div>
              </div>

              {editingSource && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {sourceForm.isActive ? 'Aparece como pendente todo mês' : 'Pausada'}
                    </p>
                  </div>
                  <button type="button"
                    role="switch"
                    aria-checked={sourceForm.isActive}
                    aria-label={sourceForm.isActive ? 'Pausar fonte de receita' : 'Ativar fonte de receita'}
                    onClick={() => setSourceForm({ ...sourceForm, isActive: !sourceForm.isActive })}
                    style={{
                      width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                      background: sourceForm.isActive ? 'var(--accent)' : 'var(--border)',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3, left: sourceForm.isActive ? 23 : 3,
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={sourceForm.notes}
                  onChange={(e) => setSourceForm({ ...sourceForm, notes: e.target.value })}
                  placeholder="Observações..."
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              {sourceSuccess && (
                <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>✓ {sourceSuccess}</p>
              )}

              <button
                onClick={saveSource}
                disabled={!sourceForm.description.trim() || !sourceForm.categoryId}
                className="w-full py-3 rounded-2xl text-white font-medium text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
              >
                {editingSource ? 'Salvar alterações' : 'Criar fonte'}
              </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
