'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { TrendingUp, Shield, Zap, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const features = [
  { icon: Zap, title: 'Ciclos semanais', desc: 'Controle em 7 dias para decisões mais rápidas e eficazes.' },
  { icon: TrendingUp, title: 'Visão clara', desc: 'Gráficos e resumos elegantes do seu padrão de gastos.' },
  { icon: Shield, title: 'Privacidade total', desc: 'Seus dados ficam só no seu dispositivo, sem servidores.' },
]

export default function LandingPage() {
  const { isAuthenticated, login } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  const handleLogin = () => { login(); router.push('/dashboard') }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 60,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>7</span>
          </div>
          <span className="gradient-text" style={{ fontWeight: 700, fontSize: 18 }}>7Dias</span>
        </div>
        <button onClick={handleLogin} style={{
          color: 'var(--accent)', fontWeight: 500, fontSize: 14,
          background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px',
          borderRadius: 10,
        }}>
          Entrar
        </button>
      </header>

      {/* ── Hero ── */}
      <section style={{ padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <motion.div
          style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 100, marginBottom: 32,
            border: '1px solid var(--accent)', color: 'var(--accent)',
            background: 'var(--accent-light)', fontSize: 12, fontWeight: 500,
          }}>
            <Zap size={12} />
            Controle financeiro semanal
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 800, lineHeight: 1.05, marginBottom: 24 }}>
            Seu dinheiro.<br />
            <span className="gradient-text">A cada 7 dias.</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-muted)', maxWidth: 480, marginBottom: 36, lineHeight: 1.6 }}>
            Pare de perder o controle no fim do mês. Com ciclos semanais curtos,
            você toma decisões mais rápidas e eficazes sobre seus gastos.
          </p>

          <button onClick={handleLogin} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 16,
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            color: '#fff', fontWeight: 600, fontSize: 16, border: 'none',
            cursor: 'pointer', boxShadow: '0 0 30px rgba(16,185,129,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.04)' }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Começar agora <ArrowRight size={18} />
          </button>
        </motion.div>

        {/* Preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
          style={{
            marginTop: 56, width: '100%', maxWidth: 320, textAlign: 'left',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 24, padding: 24,
            boxShadow: '0 8px 48px rgba(0,0,0,0.2)',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Esta semana</p>
          <p style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>R$ 687,40</p>
          <div style={{ background: 'var(--bg-input)', borderRadius: 100, height: 8, marginBottom: 8 }}>
            <div style={{ width: '68%', height: '100%', borderRadius: 100, background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>68% do orçamento de R$ 1.000</p>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '56px 24px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
              style={{
                padding: 20, borderRadius: 20,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12, marginBottom: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--accent-light)',
              }}>
                <Icon size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>{title}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Auth ── */}
      <section style={{ padding: '56px 24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 360, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 28 }}>
            Entrar na plataforma
          </h2>

          {/* Google */}
          <button onClick={handleLogin} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '13px 16px', borderRadius: 16, marginBottom: 10,
            background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          {/* Apple */}
          <button onClick={handleLogin} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '13px 16px', borderRadius: 16, marginBottom: 16,
            background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Continuar com Apple
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Email */}
          <input
            type="email"
            placeholder="seu@email.com"
            style={{
              width: '100%', padding: '13px 16px', borderRadius: 16, marginBottom: 10,
              background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)',
              fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <button onClick={handleLogin} style={{
            width: '100%', padding: '13px 16px', borderRadius: 16,
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
          }}>
            Entrar com email
          </button>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
            Versão MVP — dados salvos localmente no seu dispositivo
          </p>
        </div>
      </section>

    </div>
  )
}
