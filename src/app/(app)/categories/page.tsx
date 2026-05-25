'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { CATEGORY_COLORS } from '@/data/categories'
import { Category } from '@/types'

const ICONS = [
  // Alimentação & bebidas
  'Utensils', 'Coffee', 'ShoppingCart',
  // Transporte
  'Car', 'Bike', 'Fuel', 'Plane',
  // Saúde & bem-estar
  'Heart', 'Dumbbell', 'Activity', 'Pill',
  // Casa & utilities
  'Home', 'Zap', 'Wifi',
  // Lazer & entretenimento
  'Tv', 'Music', 'Gamepad2',
  // Compras & presentes
  'ShoppingBag', 'Gift', 'Scissors',
  // Trabalho & educação
  'Briefcase', 'BookOpen', 'FileText',
  // Outros
  'Smartphone', 'PawPrint', 'Baby', 'MoreHorizontal',
]

interface FormState { name: string; icon: string; color: string }
const defaultForm: FormState = { name: '', icon: 'MoreHorizontal', color: '#10b981' }

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [success, setSuccess] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const formRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const focusForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      nameInputRef.current?.focus()
    }, 120)
  }

  const openNew = () => { setEditing(null); setForm(defaultForm); setSuccess(''); setShowForm(true); focusForm() }
  const openEdit = (cat: Category) => { setEditing(cat); setForm({ name: cat.name, icon: cat.icon, color: cat.color }); setSuccess(''); setShowForm(true); focusForm() }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editing) {
      updateCategory(editing.id, form)
      setShowForm(false)
    } else {
      const savedName = form.name.trim()
      addCategory(form)
      setForm(defaultForm)
      setSuccess(`"${savedName}" criada com sucesso!`)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Categorias</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{categories.length} categorias</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
        >
          <Plus size={15} /> Nova
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <motion.div
            key={cat.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-3.5 rounded-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: cat.color + '20' }}
            >
              <CategoryIcon name={cat.icon} size={18} style={{ color: cat.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{cat.name}</p>
              {cat.isDefault && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Padrão</p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openEdit(cat)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => cat.isDefault ? setConfirmDelete(cat.id) : deleteCategory(cat.id)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: '#ef444420', color: '#ef4444' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Confirm delete default category */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
            <motion.div
              className="relative z-10 p-5 rounded-2xl border max-w-sm w-full space-y-4"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ef444420' }}>
                  <Trash2 size={16} style={{ color: '#ef4444' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm">Excluir categoria padrão?</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Despesas que usam esta categoria não serão afetadas, mas a categoria não poderá ser recuperada.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { deleteCategory(confirmDelete); setConfirmDelete(null) }}
                  className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: '#ef4444' }}
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form — bottom sheet on mobile, inline on desktop */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* Overlay (mobile only) */}
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
            />

            <motion.div
              ref={formRef}
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
                <h2 className="font-semibold">{editing ? 'Editar categoria' : 'Nova categoria'}</h2>
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
                  ref={nameInputRef}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Academia"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Ícone</label>
                <div className="grid grid-cols-7 gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: form.icon === icon ? form.color + '25' : 'var(--bg-input)',
                        border: `2px solid ${form.icon === icon ? form.color : 'transparent'}`,
                      }}
                    >
                      <CategoryIcon name={icon} size={16} style={{ color: form.icon === icon ? form.color : 'var(--text-muted)' }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Cor</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ background: color }}
                    >
                      {form.color === color && <Check size={14} className="text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              {success && (
                <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>✓ {success}</p>
              )}

              {/* Save */}
              <button
                onClick={handleSave}
                className="w-full py-3 rounded-2xl text-white font-medium text-sm"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
              >
                {editing ? 'Salvar alterações' : 'Criar categoria'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
