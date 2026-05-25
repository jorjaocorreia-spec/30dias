'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, Filter, X, Users, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { formatCurrency, formatDate, getEffectiveAmount } from '@/lib/weekHelpers'

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: 'Cartão',
  pix: 'Pix',
  ted: 'TED',
  cash: 'Dinheiro',
}

export default function ExpensesListPage() {
  const { expenses, categories, fixedExpenses, deleteExpense, markParticipantAsPaid } = useAppStore()

  const [filterCategory, setFilterCategory] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'variable' | 'fixed' | 'shared'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [sharedOpen, setSharedOpen] = useState<Set<string>>(new Set())

  const toggleSharedOpen = (id: string) => {
    setSharedOpen(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        if (filterCategory && e.categoryId !== filterCategory) return false
        if (filterFrom && e.date < filterFrom) return false
        if (filterTo && e.date > filterTo) return false
        if (filterType === 'fixed' && !e.fixedExpenseId) return false
        if (filterType === 'variable' && e.fixedExpenseId) return false
        if (filterType === 'shared' && !e.sharedWith?.length) return false
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [expenses, filterCategory, filterFrom, filterTo, filterType])

  const hasFilters = !!(filterCategory || filterFrom || filterTo || filterType !== 'all')

  const clearFilters = () => {
    setFilterCategory('')
    setFilterFrom('')
    setFilterTo('')
    setFilterType('all')
  }

  const handleDelete = (id: string) => {
    deleteExpense(id)
    setDeleteConfirm(null)
  }

  const getCat = (id: string) => categories.find((c) => c.id === id)

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">Despesas</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
            {hasFilters && ' (filtrado)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium"
              style={{ background: '#ef444420', color: '#ef4444' }}
            >
              <X size={12} /> Limpar
            </button>
          )}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium"
            style={{
              background: showFilters || hasFilters ? 'var(--accent-light)' : 'var(--bg-input)',
              color: showFilters || hasFilters ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            <Filter size={14} /> Filtrar
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            key="filters"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="p-4 rounded-2xl border mb-5 space-y-3"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Filtros</p>

              {/* Type filter */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Tipo
                </label>
                <div className="flex gap-1.5">
                  {([
                    { value: 'all', label: 'Todas' },
                    { value: 'variable', label: 'Variáveis' },
                    { value: 'fixed', label: '🔁 Fixas' },
                    { value: 'shared', label: '👥 Divididas' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFilterType(value)}
                      className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: filterType === value ? 'var(--accent-light)' : 'var(--bg-input)',
                        color: filterType === value ? 'var(--accent)' : 'var(--text-muted)',
                        border: `1px solid ${filterType === value ? 'var(--accent)' : 'transparent'}`,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    De
                  </label>
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Até
                  </label>
                  <input
                    type="date"
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Categoria
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">Nenhuma despesa encontrada.</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((expense) => {
            const cat = getCat(expense.categoryId)
            const isDeleting = deleteConfirm === expense.id

            return (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3.5 rounded-2xl border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-start gap-3">
                  {/* Category icon */}
                  {cat && (
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cat.color + '20', marginTop: 2 }}
                    >
                      <CategoryIcon name={cat.icon} size={16} style={{ color: cat.color }} />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm truncate">{expense.description}</p>
                      <div className="flex-shrink-0 text-right">
                        <p className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>
                          {formatCurrency(getEffectiveAmount(expense))}
                        </p>
                        {expense.sharedWith?.length ? (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            total {formatCurrency(expense.amount)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(expense.date)}
                      </span>
                      {cat && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-lg font-medium"
                          style={{ background: cat.color + '20', color: cat.color }}
                        >
                          {cat.name}
                        </span>
                      )}
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-lg"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                      >
                        {PAYMENT_LABELS[expense.paymentMethod] ?? expense.paymentMethod}
                      </span>
                      {expense.fixedExpenseId && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-lg font-medium"
                          style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}
                        >
                          🔁 Fixa
                        </span>
                      )}
                      {expense.sharedWith?.length ? (() => {
                        const total = expense.sharedWith.length
                        const paid = expense.sharedWith.filter(p => p.paid).length
                        return (
                          <button
                            type="button"
                            onClick={() => toggleSharedOpen(expense.id)}
                            className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-lg font-medium"
                            style={{ background: '#06b6d420', color: '#06b6d4' }}
                          >
                            <Users size={10} />
                            {paid}/{total} pagaram
                          </button>
                        )
                      })() : null}
                    </div>
                  </div>
                </div>

                {/* Shared participants panel */}
                <AnimatePresence>
                  {expense.sharedWith?.length && sharedOpen.has(expense.id) ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        className="mt-3 pt-3 space-y-2"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                          Participantes
                        </p>
                        {expense.sharedWith.map((p) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{p.name}</p>
                              {p.paidAt && (
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  pago em {new Date(p.paidAt + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                            <p
                              className="text-sm font-semibold flex-shrink-0"
                              style={{ color: p.paid ? '#10b981' : 'var(--text-muted)' }}
                            >
                              {formatCurrency(p.amount)}
                            </p>
                            <button
                              type="button"
                              onClick={() => markParticipantAsPaid(expense.id, p.id, !p.paid)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl font-medium flex-shrink-0"
                              style={{
                                background: p.paid ? '#10b98120' : 'var(--bg-input)',
                                color: p.paid ? '#10b981' : 'var(--text-muted)',
                                border: `1px solid ${p.paid ? '#10b98140' : 'var(--border)'}`,
                              }}
                            >
                              {p.paid ? <><Check size={11} /> Pago</> : 'Pendente'}
                            </button>
                          </div>
                        ))}
                        {(() => {
                          const pending = expense.sharedWith.filter(p => !p.paid).reduce((s, p) => s + p.amount, 0)
                          return pending > 0 ? (
                            <div
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium"
                              style={{ background: '#f59e0b15', color: '#f59e0b' }}
                            >
                              <span>A receber</span>
                              <span>{formatCurrency(pending)}</span>
                            </div>
                          ) : (
                            <div
                              className="px-3 py-2 rounded-xl text-xs font-medium text-center"
                              style={{ background: '#10b98115', color: '#10b981' }}
                            >
                              Todos pagaram!
                            </div>
                          )
                        })()}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Actions */}
                {isDeleting ? (
                  <div
                    className="flex items-center gap-2 mt-3 pt-3"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <p className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>
                      Excluir esta despesa?
                    </p>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: '#ef444420', color: '#ef4444' }}
                    >
                      Excluir
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-1.5 mt-2.5">
                    <Link
                      href={`/expenses/${expense.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', textDecoration: 'none' }}
                    >
                      <Pencil size={12} /> Editar
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(expense.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: '#ef444420', color: '#ef4444' }}
                    >
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
