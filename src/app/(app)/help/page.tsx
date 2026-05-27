'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, Zap, LayoutDashboard, ShoppingCart, Repeat2, Users,
  Wallet, TrendingUp, BarChart2, Tag, Store, Smartphone, ChevronRight, HelpCircle,
} from 'lucide-react'
import { helpArticles, helpCategories, HelpArticle } from '@/data/helpContent'

const iconMap: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Zap, LayoutDashboard, ShoppingCart, Repeat2, Users, Wallet,
  TrendingUp, BarChart2, Tag, Store, Smartphone,
}

function ArticleCard({ article }: { article: HelpArticle }) {
  const Icon = iconMap[article.iconName] ?? HelpCircle
  return (
    <Link
      href={`/help/${article.slug}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 20,
        borderRadius: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        textDecoration: 'none',
        transition: 'border-color 0.15s',
      }}
    >
      <div
        style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--accent-light)',
          color: 'var(--accent)',
        }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{article.title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{article.description}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 13, fontWeight: 500, marginTop: 'auto' }}>
        Ler guia <ChevronRight size={14} />
      </div>
    </Link>
  )
}

export default function HelpPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return helpArticles
    return helpArticles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.sections.some(s =>
        s.title.toLowerCase().includes(q) ||
        s.blocks.some(b => 'text' in b && b.text.toLowerCase().includes(q))
      )
    )
  }, [query])

  const grouped = useMemo(() => {
    const result: Record<string, HelpArticle[]> = {}
    for (const article of filtered) {
      if (!result[article.category]) result[article.category] = []
      result[article.category].push(article)
    }
    return result
  }, [filtered])

  const categoryOrder: HelpArticle['category'][] = ['inicio', 'financas', 'analise', 'integracoes']

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 mx-auto" style={{ maxWidth: 880 }}>

      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
          }}
        >
          <HelpCircle size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Central de Ajuda</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Guias completos sobre todas as funcionalidades do 7Dias</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 40 }}>
        <Search
          size={18}
          style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Buscar no guia..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 16px 14px 48px',
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--bg-input)',
            color: 'var(--text)',
            fontSize: 15,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>Nenhum resultado para "{query}"</p>
          <p style={{ fontSize: 14 }}>Tente outras palavras-chave</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {categoryOrder.map(cat => {
            const articles = grouped[cat]
            if (!articles?.length) return null
            return (
              <section key={cat}>
                <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>
                  {helpCategories[cat]}
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 16,
                  }}
                >
                  {articles.map(a => <ArticleCard key={a.slug} article={a} />)}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
