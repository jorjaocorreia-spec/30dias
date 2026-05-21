'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Store, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Establishment } from '@/types'

const QUICK_CAT_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#64748b']

interface FormState { name: string; categoryId: string }
const defaultForm: FormState = { name: '', categoryId: '' }

export default function EstablishmentsPage() {
  const { establishments, categories, addEstablishment, updateEstablishment, deleteEstablishment, addCategory } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Establishment | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Quick-add category state
  const [showQuickCat, setShowQuickCat] = useState(false)
  const [quickCatName, setQuickCatName] = useState('')
  const [quickCatColor, setQuickCatColor] = useState(QUICK_CAT_COLORS[0])

  const openNew = () => { setEditing(null); setForm({ name: '', categoryId: categories[0]?.id ?? '' }); setError(''); setSuccess(''); setShowQuickCat(false); setShowForm(true) }
  const openEdit = (est: Establishment) => { setEditing(est); setForm({ name: est.name, categoryId: est.categoryId }); setError(''); setSuccess(''); setShowQuickCat(false); setShowForm(true) }

  const handleQuickAddCategory = () => {
    if (!quickCatName.trim()) return
    addCategory({ name: quickCatName.trim(), icon: 'MoreHorizontal', color: quickCatColor })
    const newCat = useAppStore.getState().categories.find((c) => c.name === quickCatName.trim())
    if (newCat) setForm((f) => ({ ...f, categoryId: newCat.id }))
    setQuickCatName('')
    setShowQuickCat(false)
  }

  const handleSave = () => {
    if (!form.name.trim()) { setError('Nome obrigatório'); return }
    if (!form.categoryId) { setError('Selecione uma categoria'); return }
    if (editing) {
      updateEstablishment(editing.id, form)
      setShowForm(false)
    } else {
      const savedName = form.name.trim()
      addEstablishment(form)
      setForm({ name: '', categoryId: form.categoryId })
      setError('')
      setSuccess(`"${savedName}" cadastrado com sucesso!`)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const fieldStyle = { background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Estabelecimentos</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {establishments.length === 0 ? 'Nenhum cadastrado' : `${establishments.length} cadastrado${establishments.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
        >
          <Plus size={15} /> Novo
        </button>
      </div>

      {/* Empty state */}
      {establishments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <Store size={28} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="font-medium mb-1">Nenhum estabelecimento</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Cadastre um local e vincule a uma categoria para agilizar o lançamento de despesas.
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {establishments.map((est) => {
          const cat = categories.find((c) => c.id === est.categoryId)
          return (
            <motion.div
              key={est.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-3.5 rounded-2xl border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: cat ? cat.color + '20' : 'var(--bg-input)' }}
              >
                {cat
                  ? <CategoryIcon name={cat.icon} size={18} style={{ color: cat.color }} />
                  : <Store size={18} style={{ color: 'var(--text-muted)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{est.name}</p>
                {cat && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{cat.name}</p>}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEdit(est)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => deleteEstablishment(est.id)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#ef444420', color: '#ef4444' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Form — bottom sheet mobile / inline desktop */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
            />

            <motion.div
              className="fixed lg:relative bottom-0 lg:bottom-auto left-0 lg:left-auto right-0 lg:right-auto z-50 lg:z-auto
                         p-5 rounded-t-3xl lg:rounded-2xl border-t lg:border mt-6 space-y-4"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Form header */}
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{editing ? 'Editar estabelecimento' : 'Novo estabelecimento'}</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setError('') }}
                  placeholder="Ex: Supermercado Extra"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={fieldStyle}
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Categoria padrão</label>
                  <button
                    type="button"
                    onClick={() => { setShowQuickCat((v) => !v); setQuickCatName(''); setQuickCatColor(QUICK_CAT_COLORS[0]) }}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                    style={{ color: 'var(--accent)', background: 'var(--accent-light)', border: 'none', cursor: 'pointer' }}
                  >
                    <Plus size={11} /> Nova categoria
                  </button>
                </div>

                <select
                  value={form.categoryId}
                  onChange={(e) => { setForm({ ...form, categoryId: e.target.value }); setError('') }}
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={fieldStyle}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                {/* Quick-add category */}
                <AnimatePresence>
                  {showQuickCat && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="mt-2 p-3 rounded-2xl space-y-2" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Criar categoria rápida</p>
                        <input
                          type="text"
                          value={quickCatName}
                          onChange={(e) => setQuickCatName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickAddCategory() } }}
                          placeholder="Nome da categoria"
                          autoFocus
                          className="w-full px-3 py-2 rounded-xl border outline-none text-sm"
                          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        />
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5 flex-1 flex-wrap">
                            {QUICK_CAT_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setQuickCatColor(color)}
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: color, border: quickCatColor === color ? '2px solid var(--text)' : '2px solid transparent' }}
                              >
                                {quickCatColor === color && <Check size={11} color="#fff" strokeWidth={3} />}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={handleQuickAddCategory}
                            disabled={!quickCatName.trim()}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-white flex-shrink-0"
                            style={{ background: quickCatName.trim() ? 'var(--accent)' : 'var(--border)', cursor: quickCatName.trim() ? 'pointer' : 'default' }}
                          >
                            <Check size={12} /> Criar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}
              {success && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  ✓ {success}
                </motion.p>
              )}

              {/* Save */}
              <button
                onClick={handleSave}
                className="w-full py-3 rounded-2xl text-white font-medium text-sm"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
              >
                {editing ? 'Salvar alterações' : 'Criar estabelecimento'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
