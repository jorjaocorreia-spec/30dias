'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Target, Check } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { formatCurrency } from '@/lib/weekHelpers'

export default function BudgetPage() {
  const { preferences, categories, setWeeklyBudget, setBudgetMode, setCategoryBudget } = useAppStore()
  const { budgetMode, weeklyBudget, categoryBudgets = {} } = preferences

  const [fixedValue, setFixedValue] = useState(String(weeklyBudget))
  const [catValues, setCatValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      categories.map((c) => [c.id, categoryBudgets[c.id] ? String(categoryBudgets[c.id]) : ''])
    )
  )
  const [savedFixed, setSavedFixed] = useState(false)
  const [savedCat, setSavedCat] = useState(false)

  const totalCat = categories.reduce((sum, c) => {
    const v = parseFloat(catValues[c.id] ?? '')
    return sum + (isNaN(v) || v < 0 ? 0 : v)
  }, 0)

  const handleSaveFixed = () => {
    const v = parseFloat(fixedValue)
    if (!isNaN(v) && v > 0) {
      setWeeklyBudget(v)
      setSavedFixed(true)
      setTimeout(() => setSavedFixed(false), 2000)
    }
  }

  const handleSaveCat = () => {
    categories.forEach((c) => {
      const v = parseFloat(catValues[c.id] ?? '')
      setCategoryBudget(c.id, isNaN(v) || v < 0 ? 0 : v)
    })
    setSavedCat(true)
    setTimeout(() => setSavedCat(false), 2000)
  }

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold">Orçamento</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Defina quanto deseja gastar por semana
        </p>
      </div>

      {/* Mode toggle */}
      <div
        className="flex rounded-2xl p-1 mb-6"
        style={{ background: 'var(--bg-input)' }}
      >
        {([
          ['fixed', 'Valor fixo', Wallet],
          ['per_category', 'Por categoria', Target],
        ] as const).map(([mode, label, Icon]) => (
          <button
            key={mode}
            onClick={() => setBudgetMode(mode)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: budgetMode === mode ? 'var(--bg-card)' : 'transparent',
              color: budgetMode === mode ? 'var(--accent)' : 'var(--text-muted)',
              boxShadow: budgetMode === mode ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.2s',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Fixed mode */}
      {budgetMode === 'fixed' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm font-semibold mb-1">Orçamento semanal total</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Valor máximo disponível para gastar durante a semana
          </p>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: 'var(--text-muted)', pointerEvents: 'none' }}
              >
                R$
              </span>
              <input
                type="number"
                min="0"
                step="50"
                value={fixedValue}
                onChange={(e) => setFixedValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFixed()}
                className="w-full rounded-xl text-sm font-medium"
                style={{
                  padding: '11px 12px 11px 38px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={handleSaveFixed}
              className="px-5 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{
                background: savedFixed ? '#10b981' : 'linear-gradient(135deg, #10b981, #06b6d4)',
                color: '#fff',
                cursor: 'pointer',
                border: 'none',
                transition: 'background 0.3s',
                minWidth: 88,
                justifyContent: 'center',
              }}
            >
              {savedFixed ? <><Check size={15} /> Salvo!</> : 'Salvar'}
            </button>
          </div>

          {/* Preview */}
          <div
            className="mt-4 p-3 rounded-xl flex items-center justify-between"
            style={{ background: 'var(--bg-input)' }}
          >
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Orçamento atual</span>
            <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
              {formatCurrency(weeklyBudget)}
            </span>
          </div>
        </motion.div>
      )}

      {/* Per category mode */}
      {budgetMode === 'per_category' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="rounded-2xl border overflow-hidden mb-4"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold">Orçamento por categoria</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Deixe em branco as categorias sem limite definido
              </p>
            </div>

            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-5 py-3"
                style={{
                  borderBottom: i < categories.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cat.color + '20' }}
                >
                  <CategoryIcon name={cat.icon} size={15} style={{ color: cat.color }} />
                </div>
                <span className="flex-1 text-sm font-medium truncate">{cat.name}</span>
                <div className="relative" style={{ width: 120 }}>
                  <span
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: 'var(--text-muted)', pointerEvents: 'none' }}
                  >
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="—"
                    value={catValues[cat.id] ?? ''}
                    onChange={(e) =>
                      setCatValues((prev) => ({ ...prev, [cat.id]: e.target.value }))
                    }
                    className="w-full rounded-xl text-sm text-right"
                    style={{
                      padding: '8px 10px 8px 28px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      outline: 'none',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer: total + save */}
          <div
            className="flex items-center justify-between p-4 rounded-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total semanal</p>
              <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                {formatCurrency(totalCat)}
              </p>
            </div>
            <button
              onClick={handleSaveCat}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{
                background: savedCat ? '#10b981' : 'linear-gradient(135deg, #10b981, #06b6d4)',
                color: '#fff',
                cursor: 'pointer',
                border: 'none',
                transition: 'background 0.3s',
                minWidth: 120,
                justifyContent: 'center',
              }}
            >
              {savedCat ? <><Check size={15} /> Salvo!</> : 'Salvar tudo'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
