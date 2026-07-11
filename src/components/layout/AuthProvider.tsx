'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAppStore(s => s.initAuth)

  useEffect(() => {
    initAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // A store só busca os dados uma vez, no mount. Se a aba ficar aberta em segundo
  // plano (ex.: celular suspende, usuário troca de app) e uma despesa for
  // registrada via WhatsApp nesse meio tempo, o cache local fica desatualizado
  // até um reload completo. Refaz o fetch quando a aba volta a ficar visível.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        useAppStore.getState().loadUserData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return <>{children}</>
}
