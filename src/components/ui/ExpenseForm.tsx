'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Expense, PaymentMethod } from '@/types'
import { formatCurrency } from '@/lib/weekHelpers'
import { CategoryIcon } from './CategoryIcon'
import { getTodayKey } from '@/lib/weekHelpers'

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'credit_card', label: 'Cartão de Crédito', icon: '💳' },
  { value: 'pix', label: 'Pix', icon: '⚡' },
  { value: 'ted', label: 'TED', icon: '🏦' },
  { value: 'cash', label: 'Dinheiro', icon: '💵' },
]

const QUICK_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#64748b']

const schema = z.object({
  amount: z.number().positive('Valor deve ser maior que zero'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  description: z.string().min(1, 'Descrição obrigatória').max(100),
  date: z.string().min(1, 'Data obrigatória'),
  notes: z.string().optional(),
  paymentMethod: z.enum(['credit_card', 'pix', 'ted', 'cash']),
  establishmentId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  initialData?: Expense
  onSuccess: (description: string) => void
}

export function ExpenseForm({ initialData, onSuccess }: Props) {
  const { categories, establishments, addExpense, updateExpense, addCategory, addEstablishment, addFixedExpense } = useAppStore()
  const isEdit = !!initialData

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: initialData?.amount ?? ('' as unknown as number),
      categoryId: initialData?.categoryId ?? '',
      description: initialData?.description ?? '',
      date: initialData?.date ?? getTodayKey(),
      notes: initialData?.notes ?? '',
      paymentMethod: initialData?.paymentMethod ?? 'pix',
      establishmentId: initialData?.establishmentId ?? undefined,
    },
  })

  const selectedCategoryId = watch('categoryId')
  const selectedPaymentMethod = watch('paymentMethod')
  const watchedAmount = watch('amount')

  // Fixed expense toggle (only for new expenses)
  const [isFixed, setIsFixed] = useState(false)
  const weeklyAmount = isFixed && watchedAmount > 0 ? Math.round((watchedAmount / 4) * 100) / 100 : 0

  // ── Establishment autocomplete ──
  const initialEstName = initialData?.establishmentId
    ? (establishments.find((e) => e.id === initialData.establishmentId)?.name ?? '')
    : ''
  const [estSearch, setEstSearch] = useState(initialEstName)
  const [estOpen, setEstOpen] = useState(false)
  const [estSelected, setEstSelected] = useState(!!initialData?.establishmentId)
  const estRef = useRef<HTMLDivElement>(null)

  const filteredEsts = estSearch.length > 0 && !estSelected
    ? establishments.filter((e) => e.name.toLowerCase().includes(estSearch.toLowerCase()))
    : []

  const selectEstablishment = (id: string, name: string, categoryId: string) => {
    setEstSearch(name); setEstSelected(true); setEstOpen(false)
    setValue('establishmentId', id); setValue('categoryId', categoryId)
  }
  const clearEstablishment = () => { setEstSearch(''); setEstSelected(false); setValue('establishmentId', undefined) }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (estRef.current && !estRef.current.contains(e.target as Node)) setEstOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Quick-add establishment ──
  const [showQuickEst, setShowQuickEst] = useState(false)
  const [quickEstName, setQuickEstName] = useState('')
  const [quickEstCategoryId, setQuickEstCategoryId] = useState(categories[0]?.id ?? '')

  const handleQuickAddEst = () => {
    if (!quickEstName.trim() || !quickEstCategoryId) return
    addEstablishment({ name: quickEstName.trim(), categoryId: quickEstCategoryId })
    const newEst = useAppStore.getState().establishments.find((e) => e.name === quickEstName.trim())
    if (newEst) selectEstablishment(newEst.id, newEst.name, newEst.categoryId)
    setQuickEstName('')
    setShowQuickEst(false)
  }

  // ── Quick-add category ──
  const [showQuickCat, setShowQuickCat] = useState(false)
  const [quickCatName, setQuickCatName] = useState('')
  const [quickCatColor, setQuickCatColor] = useState(QUICK_COLORS[0])

  const handleQuickAddCat = () => {
    if (!quickCatName.trim()) return
    addCategory({ name: quickCatName.trim(), icon: 'MoreHorizontal', color: quickCatColor })
    const newCat = useAppStore.getState().categories.find((c) => c.name === quickCatName.trim())
    if (newCat) setValue('categoryId', newCat.id)
    setQuickCatName('')
    setShowQuickCat(false)
  }

  // ── Submit ──
  const newExpenseDefaults = {
    amount: '' as unknown as number,
    categoryId: '',
    description: '',
    date: getTodayKey(),
    notes: '',
    paymentMethod: 'pix' as const,
    establishmentId: undefined,
  }

  const onSubmit = (data: FormData) => {
    if (isEdit && initialData) {
      updateExpense(initialData.id, data)
      onSuccess(data.description)
    } else if (isFixed) {
      addFixedExpense({
        description: data.description,
        suggestedAmount: data.amount,
        categoryId: data.categoryId,
        establishmentId: data.establishmentId,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        isActive: true,
      })
      reset(newExpenseDefaults)
      setEstSearch(''); setEstSelected(false)
      setIsFixed(false)
      onSuccess(data.description)
    } else {
      addExpense(data)
      reset(newExpenseDefaults)
      setEstSearch(''); setEstSelected(false)
      onSuccess(data.description)
    }
  }

  const fieldClass = `w-full px-4 py-3.5 rounded-2xl border outline-none text-sm transition-colors`
  const fieldStyle = { background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }
  const quickFormStyle = { background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 16, padding: 12, marginTop: 8 }
  const quickBtnStyle = { color: 'var(--accent)', background: 'var(--accent-light)', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5">

      {/* Amount */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          {isFixed ? 'Valor sugerido por mês (R$)' : 'Valor (R$)'}
        </label>
        <input
          type="number" step="0.01" placeholder="0,00"
          {...register('amount', { valueAsNumber: true })}
          className={`${fieldClass} text-3xl font-bold`} style={fieldStyle}
        />
        {isFixed && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Valor sugerido para pré-preencher o registro de cada mês
          </p>
        )}
        {errors.amount && <p className="text-xs mt-1.5 text-red-400">{errors.amount.message}</p>}
      </div>

      {/* Fixed expense toggle — only for new expenses */}
      {!isEdit && (
        <button
          type="button"
          onClick={() => setIsFixed((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all"
          style={{
            background: isFixed ? 'var(--accent-light)' : 'var(--bg-input)',
            borderColor: isFixed ? 'var(--accent)' : 'var(--border)',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <p className="text-sm font-medium" style={{ color: isFixed ? 'var(--accent)' : 'var(--text)' }}>
              Despesa fixa mensal
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {isFixed
                ? 'Registre o valor de cada mês na página de Fixas'
                : 'Ativar para repetir todo mês — valor confirmado a cada mês'}
            </p>
          </div>
          {/* Toggle switch */}
          <div style={{
            width: 44, height: 24, borderRadius: 12, flexShrink: 0,
            background: isFixed ? 'var(--accent)' : 'var(--border)',
            position: 'relative', transition: 'background 0.2s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3, left: isFixed ? 23 : 3,
              transition: 'left 0.2s',
            }} />
          </div>
        </button>
      )}

      {/* Establishment */}
      <div ref={estRef} style={{ position: 'relative' }}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Estabelecimento (opcional)</label>
          <button type="button" onClick={() => { setShowQuickEst((v) => !v); setQuickEstName(''); setQuickEstCategoryId(categories[0]?.id ?? '') }}
            style={quickBtnStyle}>
            <Plus size={10} /> Novo local
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="text" placeholder="Buscar estabelecimento..."
            value={estSearch}
            onChange={(e) => { setEstSearch(e.target.value); setEstSelected(false); setEstOpen(true) }}
            onFocus={() => { if (!estSelected) setEstOpen(true) }}
            className={fieldClass} style={fieldStyle}
          />
          {estSearch && (
            <button type="button" onClick={clearEstablishment}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={15} />
            </button>
          )}
        </div>

        {estOpen && filteredEsts.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% - 8px)', left: 0, right: 0, zIndex: 50,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, marginTop: 4, overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}>
            {filteredEsts.map((est) => {
              const cat = categories.find((c) => c.id === est.categoryId)
              return (
                <button key={est.id} type="button"
                  onClick={() => selectEstablishment(est.id, est.name, est.categoryId)}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 14 }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-input)' }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'none' }}
                >
                  <span>{est.name}</span>
                  {cat && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.name}</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* Quick-add establishment */}
        <AnimatePresence>
          {showQuickEst && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
              <div style={quickFormStyle} className="space-y-2">
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

      {/* Category */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Categoria</label>
          <button type="button" onClick={() => { setShowQuickCat((v) => !v); setQuickCatName(''); setQuickCatColor(QUICK_COLORS[0]) }}
            style={quickBtnStyle}>
            <Plus size={10} /> Nova categoria
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button key={cat.id} type="button"
              onClick={() => setValue('categoryId', cat.id)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all text-xs font-medium"
              style={{
                borderColor: selectedCategoryId === cat.id ? cat.color : 'var(--border)',
                background: selectedCategoryId === cat.id ? cat.color + '20' : 'var(--bg-input)',
                color: selectedCategoryId === cat.id ? cat.color : 'var(--text-muted)',
              }}>
              <CategoryIcon name={cat.icon} size={18} />
              <span className="text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>

        {errors.categoryId && <p className="text-xs mt-1.5 text-red-400">{errors.categoryId.message}</p>}

        {/* Quick-add category */}
        <AnimatePresence>
          {showQuickCat && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
              <div style={quickFormStyle} className="space-y-2">
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

      {/* Description */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Descrição</label>
        <input type="text" placeholder="Ex: Almoço no restaurante" {...register('description')}
          className={fieldClass} style={fieldStyle} />
        {errors.description && <p className="text-xs mt-1.5 text-red-400">{errors.description.message}</p>}
      </div>

      {/* Date */}
      {!isFixed && (
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Data</label>
          <input type="date" {...register('date')} className={fieldClass} style={fieldStyle} />
          {errors.date && <p className="text-xs mt-1.5 text-red-400">{errors.date.message}</p>}
        </div>
      )}

      {/* Payment Method */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Meio de pagamento</label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map(({ value, label, icon }) => (
            <button key={value} type="button"
              onClick={() => setValue('paymentMethod', value)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all text-sm font-medium"
              style={{
                borderColor: selectedPaymentMethod === value ? 'var(--accent)' : 'var(--border)',
                background: selectedPaymentMethod === value ? 'var(--accent-light)' : 'var(--bg-input)',
                color: selectedPaymentMethod === value ? 'var(--accent)' : 'var(--text-muted)',
              }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
        {errors.paymentMethod && <p className="text-xs mt-1.5 text-red-400">{errors.paymentMethod.message}</p>}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Notas (opcional)</label>
        <textarea rows={2} placeholder="Informações adicionais..." {...register('notes')}
          className={`${fieldClass} resize-none`} style={fieldStyle} />
      </div>

      {/* Submit */}
      <button type="submit" disabled={isSubmitting}
        className="w-full py-4 rounded-2xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
        {isEdit ? 'Salvar alterações' : isFixed ? 'Criar despesa fixa' : 'Adicionar despesa'}
      </button>
    </motion.form>
  )
}
