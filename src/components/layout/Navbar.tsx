'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusCircle, Tag, BarChart2, Store, List, Repeat2, Wallet, TrendingUp, Sun, Moon, LogOut } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/expenses/new', icon: PlusCircle, label: 'Adicionar' },
  { href: '/expenses', icon: List, label: 'Despesas' },
  { href: '/fixed-expenses', icon: Repeat2, label: 'Fixas' },
  { href: '/income', icon: TrendingUp, label: 'Receitas' },
  { href: '/budget', icon: Wallet, label: 'Orçamento' },
  { href: '/categories', icon: Tag, label: 'Categorias' },
  { href: '/establishments', icon: Store, label: 'Locais' },
  { href: '/summary', icon: BarChart2, label: 'Resumo' },
]

function isActive(pathname: string, href: string) {
  if (href === '/expenses/new') return pathname === '/expenses/new'
  if (href === '/expenses') return pathname === '/expenses' || (pathname.startsWith('/expenses/') && pathname !== '/expenses/new')
  return pathname === href || pathname.startsWith(href + '/')
}

export function Navbar() {
  const pathname = usePathname()
  const { preferences, setTheme, logout } = useAppStore()

  const toggleTheme = () => setTheme(preferences.theme === 'dark' ? 'light' : 'dark')

  return (
    <>
      {/* ── Sidebar desktop (visível via CSS media query em globals.css) ── */}
      <aside className="app-sidebar">
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-6"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-lg"
            style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            }}
          >
            <span className="text-white font-bold text-sm">7</span>
          </div>
          <span className="font-bold text-base gradient-text">7Dias</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: active ? 'var(--accent-light)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium w-full"
            style={{ color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer' }}
          >
            {preferences.theme === 'dark' ? <Sun size={18} style={{ flexShrink: 0 }} /> : <Moon size={18} style={{ flexShrink: 0 }} />}
            {preferences.theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium w-full"
            style={{ color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer' }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            Sair
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
