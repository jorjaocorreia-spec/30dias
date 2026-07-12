'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface CenteredModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: number
  /** Bottom sheet on mobile, centered dialog on desktop (lg:). Defaults to always-centered. */
  mobileBottomSheet?: boolean
  /** Caps height and makes content scroll — for taller forms. */
  maxHeight?: string
}

/** Shared centered-modal shell (backdrop z-40 + pointer-events-split content z-50), extracted from AchievementCelebrationModal's implementation. */
export function CenteredModal({ open, onClose, children, maxWidth = 400, mobileBottomSheet = false, maxHeight }: CenteredModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div
            className={`fixed inset-0 z-50 flex ${mobileBottomSheet ? 'items-end lg:items-center' : 'items-center'} justify-center px-4 pointer-events-none`}
          >
            <motion.div
              className={mobileBottomSheet ? 'w-full rounded-t-3xl lg:rounded-3xl' : 'w-full rounded-3xl'}
              style={{
                maxWidth, background: 'var(--bg-modal)', border: '1px solid var(--border)', pointerEvents: 'auto', padding: 24,
                ...(maxHeight ? { maxHeight, overflowY: 'auto' as const } : {}),
              }}
              initial={mobileBottomSheet ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.95 }}
              animate={mobileBottomSheet ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1 }}
              exit={mobileBottomSheet ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
