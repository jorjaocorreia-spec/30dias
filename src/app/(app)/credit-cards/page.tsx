'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, CreditCard as CreditCardIcon } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, getEffectiveAmount, getInvoiceMonth } from '@/lib/weekHelpers'
import { CreditCard } from '@/types'

function formatDay(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const QUICK_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#64748b']

function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

interface CardForm {
  name: string
  closingDay: string
  dueDay: string
  color: string
  isActive: boolean
}

const defaultCardForm: CardForm = { name: '', closingDay: '', dueDay: '', color: QUICK_COLORS[0], isActive: true }

export default function CreditCardsPage() {
  const { creditCards, creditCardInvoices, expenses, categories, addCreditCard, updateCreditCard, deleteCreditCard, setCreditCardInvoicePaid } = useAppStore()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CreditCard | null>(null)
  const [form, setForm] = useState<CardForm>(defaultCardForm)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const cardsInUse = useMemo(() => new Set(expenses.filter(e => e.paymentMethod === 'credit_card' && e.creditCardId).map(e => e.creditCardId!)), [expenses])

  const invoiceExpenses = (cardId: string, month: string) =>
    expenses
      .filter(e => e.paymentMethod === 'credit_card' && e.creditCardId === cardId && getInvoiceMonth(e.date, creditCards.find(c => c.id === cardId)!) === month)
      .sort((a, b) => a.date.localeCompare(b.date))

  const invoiceTotal = (cardId: string, month: string) =>
    invoiceExpenses(cardId, month).reduce((sum, e) => sum + getEffectiveAmount(e), 0)

  const invoicesForCard = (cardId: string) =>
    creditCardInvoices
      .filter(inv => inv.creditCardId === cardId)
      .filter(inv => inv.paid || invoiceTotal(cardId, inv.month) > 0)
      .sort((a, b) => b.month.localeCompare(a.month))

  const openNew = () => { setEditing(null); setForm(defaultCardForm); setShowForm(true) }
  const openEdit = (card: CreditCard) => {
    setEditing(card)
    setForm({ name: card.name, closingDay: String(card.closingDay), dueDay: String(card.dueDay), color: card.color, isActive: card.isActive })
    setShowForm(true)
  }

  const save = () => {
    const closingDay = parseInt(form.closingDay, 10)
    const dueDay = parseInt(form.dueDay, 10)
    if (!form.name.trim() || !closingDay || !dueDay || closingDay < 1 || closingDay > 31 || dueDay < 1 || dueDay > 31) return
    const data = { name: form.name.trim(), closingDay, dueDay, color: form.color, isActive: form.isActive }
    if (editing) updateCreditCard(editing.id, data)
    else addCreditCard(data)
    setShowForm(false)
  }

  const toggleActive = (card: CreditCard) => updateCreditCard(card.id, { isActive: !card.isActive })

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Cartões de Crédito</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {creditCards.filter(c => c.isActive).length} ativos
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
          <Plus size={15} /> Novo
        </button>
      </div>

      {creditCards.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <CreditCardIcon size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p className="text-sm font-medium">Nenhum cartão cadastrado</p>
          <p className="text-xs mt-1">Cadastre para acompanhar suas faturas por vencimento</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {creditCards.map(card => {
            const invoices = invoicesForCard(card.id)
            const pending = invoices.filter(inv => !inv.paid)
            const isExpanded = expandedId === card.id
            const isDeleting = deleteConfirm === card.id
            const inUse = cardsInUse.has(card.id)

            return (
              <motion.div key={card.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border overflow-hidden"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', opacity: card.isActive ? 1 : 0.6 }}>

                <div className="flex items-start gap-3 p-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: card.color + '20' }}>
                    <CreditCardIcon size={18} style={{ color: card.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{card.name}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                      {pending.length > 0 && ` · ${pending.length} fatura${pending.length > 1 ? 's' : ''} pendente${pending.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <button onClick={() => setExpandedId(isExpanded ? null : card.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div className="px-3.5 pb-3 space-y-1.5" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                        {invoices.length === 0 ? (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nenhuma fatura ainda.</p>
                        ) : invoices.map(inv => {
                          const total = invoiceTotal(card.id, inv.month)
                          const invExpenses = invoiceExpenses(card.id, inv.month)
                          const isInvOpen = expandedInvoice === inv.id
                          return (
                            <div key={inv.id}>
                              <button onClick={() => setExpandedInvoice(isInvOpen ? null : inv.id)}
                                className="w-full flex items-center justify-between gap-2 py-1"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <span className="flex items-center gap-1 text-xs" style={{ color: inv.paid ? 'var(--text-muted)' : '#f59e0b' }}>
                                  {isInvOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  {formatMonth(inv.month)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-dm-mono)' }}>{formatCurrency(total)}</span>
                                  <span onClick={(e) => { e.stopPropagation(); setCreditCardInvoicePaid(inv.id, !inv.paid) }}
                                    className="text-xs px-2 py-0.5 rounded-lg font-medium"
                                    style={{ background: inv.paid ? 'var(--bg-input)' : 'rgba(245,158,11,0.15)', color: inv.paid ? 'var(--text-muted)' : '#f59e0b' }}>
                                    {inv.paid ? 'Paga' : 'Confirmar pagamento'}
                                  </span>
                                </div>
                              </button>
                              <AnimatePresence>
                                {isInvOpen && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
                                    <div className="space-y-1 pl-4 pb-2 pt-0.5">
                                      {invExpenses.length === 0 ? (
                                        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Nenhuma despesa nesta fatura.</p>
                                      ) : invExpenses.map(exp => {
                                        const cat = categories.find(c => c.id === exp.categoryId)
                                        return (
                                          <div key={exp.id} className="flex items-center justify-between gap-2">
                                            <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                              {formatDay(exp.date)} · {exp.description || cat?.name || 'Despesa'}
                                            </span>
                                            <span className="text-xs flex-shrink-0" style={{ fontFamily: 'var(--font-dm-mono)', color: 'var(--text-muted)' }}>
                                              {formatCurrency(getEffectiveAmount(exp))}
                                            </span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isDeleting ? (
                  <div className="flex items-center gap-2 px-3.5 pb-3.5 pt-1">
                    <p className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>Excluir este cartão?</p>
                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>Cancelar</button>
                    <button onClick={() => { deleteCreditCard(card.id); setDeleteConfirm(null) }}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: '#ef444420', color: '#ef4444' }}>Excluir</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3.5 pb-3.5 pt-1">
                    <button onClick={() => toggleActive(card)}
                      className="flex items-center gap-2 text-xs font-medium"
                      style={{ color: card.isActive ? 'var(--accent)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <div style={{ width: 36, height: 20, borderRadius: 10, background: card.isActive ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: card.isActive ? 19 : 3, transition: 'left 0.2s' }} />
                      </div>
                      {card.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(card)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        onClick={() => !inUse && setDeleteConfirm(card.id)}
                        disabled={inUse}
                        title={inUse ? 'Desative em vez de excluir — há despesas vinculadas' : undefined}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-40"
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

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div className="lg:hidden fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)} />
            <motion.div
              className="fixed lg:relative bottom-0 lg:bottom-auto left-0 lg:left-auto right-0 lg:right-auto rounded-t-3xl lg:rounded-2xl border-t lg:border mt-4"
              style={{ background: 'var(--bg-modal)', borderColor: 'var(--border)', maxHeight: 'calc(92vh - env(safe-area-inset-bottom))', overflowY: 'auto', zIndex: 50 }}
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className="lg:hidden flex justify-center pt-3">
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-hover)' }} />
              </div>
              <div className="p-5 space-y-4" style={{ paddingBottom: 'calc(var(--bottomnav-h) + env(safe-area-inset-bottom))' }}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{editing ? 'Editar cartão' : 'Novo cartão'}</h2>
                  <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                    <X size={15} />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Nome</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Nubank, Inter..." className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Dia de fechamento</label>
                    <select value={form.closingDay} onChange={e => setForm({ ...form, closingDay: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                      <option value="">Selecione</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d)}>Dia {d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Dia de vencimento</label>
                    <select value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                      <option value="">Selecione</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d)}>Dia {d}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Cor</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {QUICK_COLORS.map(color => (
                      <button key={color} type="button" onClick={() => setForm({ ...form, color })}
                        className="w-7 h-7 rounded-full flex-shrink-0"
                        style={{ background: color, border: form.color === color ? '2px solid var(--text)' : '2px solid transparent' }} />
                    ))}
                  </div>
                </div>

                {editing && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Ativo</p>
                    <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}
                      style={{ width: 44, height: 24, borderRadius: 12, flexShrink: 0, background: form.isActive ? 'var(--accent)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: form.isActive ? 23 : 3, transition: 'left 0.2s' }} />
                    </button>
                  </div>
                )}

                <button onClick={save}
                  disabled={!form.name.trim() || !form.closingDay || !form.dueDay}
                  className="w-full py-3 rounded-2xl text-white font-medium text-sm disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                  {editing ? 'Salvar alterações' : 'Criar cartão'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
