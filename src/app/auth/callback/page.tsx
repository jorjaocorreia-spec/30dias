'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Listen for auth state — fires after Supabase exchanges the OAuth code
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace('/dashboard')
      } else if (event === 'INITIAL_SESSION' && !session) {
        router.replace('/')
      }
    })

    // Fallback: check session after a short delay in case event already fired
    const t = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      router.replace(session ? '/dashboard' : '/')
    }, 2000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(t)
    }
  }, [router])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #10b981, #06b6d4)',
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>7</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Autenticando...</p>
      </div>
    </div>
  )
}
