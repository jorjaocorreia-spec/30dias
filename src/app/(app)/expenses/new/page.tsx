'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ExpenseForm } from '@/components/ui/ExpenseForm'

export default function NewExpensePage() {
  const router = useRouter()
  const [successMsg, setSuccessMsg] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSuccess = (description: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSuccessMsg(`"${description}" adicionada com sucesso!`)
    timerRef.current = setTimeout(() => setSuccessMsg(''), 3000)
  }

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-lg mx-auto">
      <button
        onClick={() => router.back()}
        className="text-sm mb-5 flex items-center gap-1 transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Voltar
      </button>
      <h1 className="text-xl font-bold mb-4">Nova despesa</h1>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-5 text-sm font-medium"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            ✓ {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <ExpenseForm onSuccess={handleSuccess} />
    </div>
  )
}
