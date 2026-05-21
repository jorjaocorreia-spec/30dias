'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAppStore(s => s.initAuth)

  useEffect(() => {
    initAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}
