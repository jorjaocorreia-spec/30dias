'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { AchievementIcon } from '@/components/ui/AchievementIcon'

export function AchievementCelebrationModal() {
  const celebrationQueue = useAppStore(s => s.celebrationQueue)
  const dismissCelebration = useAppStore(s => s.dismissCelebration)
  const achievement = celebrationQueue[0]

  return (
    <AnimatePresence>
      {achievement && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={dismissCelebration}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            <motion.div
              className="rounded-3xl border p-6 text-center"
              style={{ background: 'var(--bg-modal)', borderColor: 'var(--border)', maxWidth: 360, pointerEvents: 'auto' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(139,92,246,0.2))',
                  boxShadow: '0 0 24px rgba(16,185,129,0.35)',
                }}
              >
                <AchievementIcon name={achievement.icon} size={28} style={{ color: '#10b981' }} />
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)', fontFamily: 'var(--font-dm-mono)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Conquista desbloqueada
              </p>
              <p className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-syne)' }}>{achievement.title}</p>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{achievement.description}</p>
              <button
                onClick={dismissCelebration}
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #10b981, #8b5cf6)', color: '#fff' }}
              >
                Continuar
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
