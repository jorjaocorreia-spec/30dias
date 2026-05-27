'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusCircle, Tag, BarChart2, Store, List, Repeat2, Wallet, TrendingUp, Target, LogOut, Plug, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { getCurrentWeekKey } from '@/store/useAppStore'
import { buildWeekSummary, getWeekDays, toLocalDateKey } from '@/lib/weekHelpers'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'main' },
  { href: '/expenses/new', icon: PlusCircle, label: 'Adicionar', section: 'main' },
  { href: '/expenses', icon: List, label: 'Despesas', section: 'main' },
  { href: '/fixed-expenses', icon: Repeat2, label: 'Fixas', section: 'main' },
  { href: '/goals', icon: Target, label: 'Metas', section: 'financial' },
  { href: '/income', icon: TrendingUp, label: 'Receitas', section: 'financial' },
  { href: '/budget', icon: Wallet, label: 'Orçamento', section: 'financial' },
  { href: '/categories', icon: Tag, label: 'Categorias', section: 'config' },
  { href: '/establishments', icon: Store, label: 'Locais', section: 'config' },
  { href: '/summary', icon: BarChart2, label: 'Resumo', section: 'config' },
  { href: '/integrations', icon: Plug, label: 'Integrações', section: 'config' },
  { href: '/help', icon: HelpCircle, label: 'Ajuda', section: 'config' },
]

const bottomNavItems = navItems.slice(0, 5)

function isActive(pathname: string, href: string) {
  if (href === '/expenses/new') return pathname === '/expenses/new'
  if (href === '/expenses') return pathname === '/expenses' || (pathname.startsWith('/expenses/') && pathname !== '/expenses/new')
  return pathname === href || pathname.startsWith(href + '/')
}

/* Week progress ring */
function WeekRing({ percent }: { percent: number }) {
  const r = 14
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(percent / 100, 1))
  const color = percent > 90 ? '#f43f5e' : percent > 70 ? '#f59e0b' : '#10b981'
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" style={{ flexShrink: 0 }}>
      <circle cx="17" cy="17" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
      <circle
        cx="17" cy="17" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 17 17)"
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s' }}
      />
      <text x="17" y="21" textAnchor="middle" fontSize="8" fontFamily="var(--font-dm-mono)" fill={color} fontWeight="700">
        {Math.round(percent)}%
      </text>
    </svg>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const { expenses, preferences, categories, getFixedWeeklyContribution, getFixedCategoryContribution, logout } = useAppStore()
  const [collapsed, setCollapsed] = useState(false)

  const fixedWeekly = getFixedWeeklyContribution()
  const fixedByCategory = getFixedCategoryContribution()
  const weekKey = getCurrentWeekKey()

  const effectiveBudget = preferences.budgetMode === 'per_category'
    ? Object.values(preferences.categoryBudgets ?? {}).reduce((a, b) => a + b, 0)
      + Object.values(fixedByCategory).reduce((a, b) => a + b, 0)
    : preferences.weeklyBudget + fixedWeekly

  const summary = buildWeekSummary(weekKey, expenses, effectiveBudget)
  const budgetPercent = effectiveBudget > 0
    ? Math.min((summary.totalAmount / effectiveBudget) * 100, 100)
    : 0

  /* Week label */
  const weekDays = getWeekDays(weekKey)
  const weekStart = weekDays[0]
  const weekEnd = weekDays[6]
  const fmtDay = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
  const weekLabel = weekStart && weekEnd
    ? `${fmtDay(weekStart)} → ${fmtDay(weekEnd)}`
    : weekKey

  /* W number */
  const wNum = weekKey.split('-W')[1] ?? ''

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed)
    return () => document.body.classList.remove('sidebar-collapsed')
  }, [collapsed])

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed') === 'true'
    if (saved) setCollapsed(true)
  }, [])

  const toggle = useCallback((val: boolean) => {
    setCollapsed(val)
    localStorage.setItem('sidebar-collapsed', String(val))
  }, [])

  /* ── Shared styles ── */
  const sidebarBg: React.CSSProperties = {
    background: 'rgba(8, 8, 14, 0.7)',
  }

  const navLinkBase = (active: boolean, col: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: col ? 'center' : 'flex-start',
    gap: col ? 0 : 10,
    padding: col ? '10px' : '9px 12px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'var(--font-nunito)',
    background: active ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.08))' : 'transparent',
    border: active ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
    boxShadow: active ? '0 0 16px rgba(16,185,129,0.08)' : 'none',
    color: active ? '#F0EDF8' : 'rgba(240,237,248,0.45)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    transition: 'all 0.15s',
    position: 'relative',
  })

  const iconBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 8,
    color: 'rgba(240,237,248,0.4)', background: 'transparent',
    cursor: 'pointer', border: 'none', flexShrink: 0,
  }

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'var(--font-dm-mono)',
    fontSize: 9,
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: 'rgba(240,237,248,0.2)',
    padding: '14px 10px 5px',
    display: collapsed ? 'none' : 'block',
  }

  const sections = [
    { key: 'main', label: 'Principal' },
    { key: 'financial', label: 'Financeiro' },
    { key: 'config', label: 'Configuração' },
  ]

  return (
    <>
      {/* ── Sidebar desktop ── */}
      <aside className="app-sidebar" style={sidebarBg}>
        {/* Brand */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '18px 0' : '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          minHeight: 68,
          flexShrink: 0,
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: collapsed ? 'pointer' : 'default', overflow: 'hidden' }}
            onClick={collapsed ? () => toggle(false) : undefined}
          >
            <div style={{
              width: 34, height: 34, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981, #8b5cf6)',
              boxShadow: '0 0 18px rgba(16,185,129,0.4)',
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-syne)' }}>7</span>
            </div>
            {!collapsed && (
              <div>
                <div style={{
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 700,
                  fontSize: 16,
                  color: '#F0EDF8',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.1,
                }}>
                  Dias
                </div>
                <div style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: 9,
                  letterSpacing: '0.14em',
                  color: 'rgba(240,237,248,0.3)',
                  marginTop: 1,
                }}>
                  // semanal
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={() => toggle(true)} style={iconBtn}>
              <ChevronLeft size={15} />
            </button>
          )}
        </div>

        {/* Expand btn when collapsed */}
        {collapsed && (
          <div style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => toggle(false)} style={iconBtn}>
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Week progress strip */}
        {!collapsed && (
          <div style={{
            margin: '12px 14px',
            padding: '10px 12px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.06))',
            border: '1px solid rgba(16,185,129,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <WeekRing percent={budgetPercent} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'rgba(240,237,248,0.4)', marginBottom: 2 }}>
                AO VIVO · W{wNum}
              </div>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: 11, fontWeight: 600, color: '#10b981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {weekLabel}
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
          {sections.map(({ key, label }) => {
            const items = navItems.filter(i => i.section === key)
            return (
              <div key={key}>
                <div style={sectionLabel}>{label}</div>
                {items.map(({ href, icon: Icon, label: lbl }) => {
                  const active = isActive(pathname, href)
                  return (
                    <Link key={href} href={href} title={collapsed ? lbl : undefined} style={navLinkBase(active, collapsed)}>
                      <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.6, ...(active ? { filter: 'drop-shadow(0 0 4px #10b981)' } : {}) }} />
                      {!collapsed && lbl}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <button
            onClick={logout}
            title={collapsed ? 'Sair' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 10,
              padding: collapsed ? '10px' : '9px 12px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-nunito)',
              color: 'rgba(240,237,248,0.3)',
              background: 'transparent',
              cursor: 'pointer',
              border: '1px solid transparent',
              width: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              transition: 'all 0.15s',
            }}
          >
            <LogOut size={15} style={{ flexShrink: 0 }} />
            {!collapsed && 'Sair'}
          </button>
        </div>
      </aside>

      {/* ── Top bar mobile ── */}
      <header className="app-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #10b981, #8b5cf6)',
            boxShadow: '0 0 14px rgba(16,185,129,0.35)',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-syne)' }}>7</span>
          </div>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: 14, color: '#F0EDF8' }}>Dias</span>
          <span style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: 9,
            padding: '2px 8px',
            borderRadius: 100,
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#10b981',
            letterSpacing: '0.08em',
          }}>W{wNum}</span>
        </div>
        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 10,
            color: 'rgba(240,237,248,0.4)', background: 'transparent', cursor: 'pointer', border: 'none',
          }}
        >
          <LogOut size={16} />
        </button>
      </header>

      {/* ── Bottom nav mobile ── */}
      <nav className="app-bottomnav">
        {bottomNavItems.map(({ href, icon: Icon, label }) => {
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
                color: active ? '#10b981' : 'rgba(240,237,248,0.4)',
                textDecoration: 'none',
              }}
            >
              <Icon size={20} style={active ? { filter: 'drop-shadow(0 0 6px #10b981)' } : {}} />
              <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-nunito)' }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
