'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { useAppStore } from '@/store/useAppStore'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  const isLoading = useAppStore(s => s.isLoading)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/')
  }, [isAuthenticated, isLoading, router])

  if (!isAuthenticated) {
    if (isLoading) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #10b981, #8b5cf6)',
              boxShadow: '0 0 24px rgba(16,185,129,0.4)',
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-syne)' }}>7</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'var(--font-dm-mono)' }}>carregando...</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      {/* Extra mesh orbs beyond the 2 in CSS pseudo-elements */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          width: 500, height: 500,
          top: '40%', left: '35%',
          borderRadius: '50%',
          background: '#06b6d4',
          filter: 'blur(120px)',
          opacity: 0.07,
          animation: 'meshOrbAlt 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          width: 400, height: 400,
          top: '20%', right: '20%',
          borderRadius: '50%',
          background: '#f59e0b',
          filter: 'blur(100px)',
          opacity: 0.06,
          animation: 'meshOrbAlt 22s ease-in-out infinite reverse',
        }} />
      </div>

      <style>{`
        @keyframes meshOrbAlt {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-30px, 25px) scale(1.04); }
          66%       { transform: translate(20px, -15px) scale(0.97); }
        }
      `}</style>

      <Navbar />
      <main className="app-main">
        {children}
      </main>
    </div>
  )
}
