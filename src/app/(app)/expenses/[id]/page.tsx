'use client'

import { useRouter, useParams } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { ExpenseForm } from '@/components/ui/ExpenseForm'
import { Trash2 } from 'lucide-react'

export default function EditExpensePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { expenses, deleteExpense } = useAppStore()
  const expense = expenses.find((e) => e.id === id)

  if (!expense) {
    return (
      <div className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
        <p className="text-sm">Despesa não encontrada.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm font-medium" style={{ color: 'var(--accent)' }}>
          Voltar
        </button>
      </div>
    )
  }

  const handleDelete = () => {
    deleteExpense(id)
    router.push('/dashboard')
  }

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => router.back()}
          className="text-sm flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Voltar
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80"
          style={{ color: '#ef4444', background: '#ef444420' }}
        >
          <Trash2 size={14} /> Excluir
        </button>
      </div>
      <h1 className="text-xl font-bold mb-6">Editar despesa</h1>
      <ExpenseForm initialData={expense} onSuccess={(_) => router.push('/dashboard')} />
    </div>
  )
}
