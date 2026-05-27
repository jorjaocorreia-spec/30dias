'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusCircle, Tag, BarChart2, Store, List, Repeat2, Wallet, TrendingUp, Target, Sun, Moon, LogOut, Plug, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/expenses/new', icon: PlusCircle, label: 'Adicionar' },
  { href: '/expenses', icon: List, label: 'Despesas' },
  { href: '/fixed-expenses', icon: Repeat2, label: 'Fixas' },
  { href: '/goals', icon: Target, label: 'Metas' },
  { href: '/income', icon: TrendingUp, label: 'Receitas' },
  { href: '/budget', icon: Wallet, label: 'Orçamento' },
  { href: '/categories', icon: Tag, label: 'Categorias' },
  { href: '/establishments', icon: Store, label: 'Locais' },
  { href: '/summary', icon: BarChart2, label: 'Resumo' },
  { href: '/integrations', icon: Plug, label: 'Integrações' },
]

function isActive(pathname: string, href: string) {
  if (href === '/expenses/new') return pathname === '/expenses/new'
  if (href === '/expenses') return pathname === '/expenses' || (pathname.startsWith('/expenses/') && pathname !== '/expenses/new')
  return pathname === href || pathname.startsWith(href + '/')
}

export function Navbar() {
  const pathname = usePathname()
  const { preferences, setTheme, logout } = useAppStore()
  const [collapsed, setCollapsed] = useState(false)

  // Sync body class with collapsed state
  useEffect(() => {
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed')
    } else {
      document.body.classList.remove('sidebar-collapsed')
    }
    return () => document.body.classList.remove('sidebar-collapsed')
  }, [collapsed])

  // Initialize from localStorage (after hydration)
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed') === 'true'
    if (saved) setCollapsed(true)
  }, [])

  const toggle = useCallback((val: boolean) => {
    setCollapsed(val)
    localStorage.setItem('sidebar-collapsed', String(val))
  }, [])

  const toggleTheme = () => setTheme(preferences.theme === 'dark' ? 'light' : 'dark')

  const iconBtn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 8,
    color: 'var(--text-muted)', background: 'transparent',
    cursor: 'pointer', border: 'none', flexShrink: 0,
  } as const

  const navLink = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: collapsed ? 0 : 12,
    padding: collapsed ? '9px' : '9px 12px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    background: active ? 'var(--accent-light)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    transition: 'opacity 0.15s',
  })

  const bottomBtn: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: collapsed ? 0 : 12,
    padding: collapsed ? '9px' : '9px 12px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-muted)',
    background: 'transparent',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  }

  return (
    <>
      {/* ── Sidebar desktop (visível via CSS media query em globals.css) ── */}
      <aside className="app-sidebar">
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '16px 0' : '16px 20px',
            borderBottom: '1px solid var(--border)',
            minHeight: 72,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: collapsed ? 'pointer' : 'default',
              overflow: 'hidden',
            }}
            onClick={collapsed ? () => toggle(false) : undefined}
            title={collapsed ? 'Expandir menu' : undefined}
          >
            <div
              style={{
                width: 32, height: 32, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>7</span>
            </div>
            {!collapsed && (
              <span className="gradient-text" style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>
                7Dias
              </span>
            )}
          </div>

          {!collapsed && (
            <button onClick={() => toggle(true)} title="Recolher menu" style={iconBtn}>
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => toggle(false)} title="Expandir menu" style={iconBtn}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(pathname, href)
            return (
              <Link key={href} href={href} title={collapsed ? label : undefined} style={navLink(active)}>
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <button
            onClick={toggleTheme}
            title={collapsed ? (preferences.theme === 'dark' ? 'Modo claro' : 'Modo escuro') : undefined}
            style={bottomBtn}
          >
            {preferences.theme === 'dark'
              ? <Sun size={18} style={{ flexShrink: 0 }} />
              : <Moon size={18} style={{ flexShrink: 0 }} />}
            {!collapsed && (preferences.theme === 'dark' ? 'Modo claro' : 'Modo escuro')}
          </button>
          <button onClick={logout} title={collapsed ? 'Sair' : undefined} style={bottomBtn}>
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && 'Sair'}
          </button>
        </div>
      </aside>

      {/* ── Top bar mobile ── */}
      <header className="app-topbar">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #10b981, #06b6d4)', flexShrink: 0 }}
          >
            <span className="text-white font-bold" style={{ fontSize: 11 }}>7</span>
          </div>
          <span className="font-bold gradient-text">7Dias</span>
        </div>
        <div className="flex items-center" style={{ gap: 4 }}>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer' }}
          >
            {preferences.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer' }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* ── Bottom nav mobile ── */}
      <nav className="app-bottomnav">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '10px 0',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                textDecoration: 'none',
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
