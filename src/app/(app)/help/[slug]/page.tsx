'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, ChevronRight, Info, Lightbulb, AlertTriangle,
  Zap, LayoutDashboard, ShoppingCart, Repeat2, Users,
  Wallet, TrendingUp, BarChart2, Tag, Store, Smartphone, HelpCircle,
} from 'lucide-react'
import { helpArticles, helpCategories, Block, Section, HelpArticle } from '@/data/helpContent'

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Zap, LayoutDashboard, ShoppingCart, Repeat2, Users, Wallet,
  TrendingUp, BarChart2, Tag, Store, Smartphone,
}

// ─── Block renderers ───────────────────────────────────────────────────────

const calloutConfig = {
  info: { bg: 'rgba(6,182,212,0.08)', border: '#06b6d4', color: '#06b6d4', Icon: Info },
  tip: { bg: 'rgba(16,185,129,0.08)', border: 'var(--accent)', color: 'var(--accent)', Icon: Lightbulb },
  warning: { bg: 'rgba(245,158,11,0.08)', border: '#f59e0b', color: '#f59e0b', Icon: AlertTriangle },
}

function Callout({ block }: { block: Extract<Block, { type: 'callout' }> }) {
  const cfg = calloutConfig[block.variant]
  return (
    <div
      style={{
        display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 12,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        marginBottom: 16,
      }}
    >
      <cfg.Icon size={16} color={cfg.color} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        {block.title && (
          <p style={{ fontWeight: 600, fontSize: 13, color: cfg.color, marginBottom: 4 }}>{block.title}</p>
        )}
        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>{block.text}</p>
      </div>
    </div>
  )
}

function Steps({ block }: { block: Extract<Block, { type: 'steps' }> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
      {block.items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              color: '#fff', fontWeight: 700, fontSize: 12,
            }}
          >
            {i + 1}
          </div>
          <div style={{ paddingTop: 4 }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: '0 0 2px' }}>{item.title}</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function BulletList({ block }: { block: Extract<Block, { type: 'list' }> }) {
  return (
    <ul style={{ margin: '0 0 16px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {block.items.map((item, i) => (
        <li key={i} style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{item}</li>
      ))}
    </ul>
  )
}

function Table({ block }: { block: Extract<Block, { type: 'table' }> }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: 'var(--bg-input)' }}>
            {block.headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                  color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase',
                  letterSpacing: '0.05em', borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}
              >{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: ri < block.rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: '10px 14px', color: ci === 0 ? 'var(--text)' : 'var(--text-muted)',
                    fontWeight: ci === 0 ? 500 : 400, lineHeight: 1.5, verticalAlign: 'top',
                  }}
                >{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CodeBlock({ block }: { block: Extract<Block, { type: 'code' }> }) {
  return (
    <pre
      style={{
        padding: '14px 16px', borderRadius: 12, background: 'var(--bg-input)',
        border: '1px solid var(--border)', fontSize: 13, overflowX: 'auto',
        color: 'var(--accent)', marginBottom: 16, lineHeight: 1.6,
      }}
    >{block.text}</pre>
  )
}

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case 'p':
      return <p key={key} style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', marginBottom: 16 }}>{block.text}</p>
    case 'h3':
      return <h3 key={key} style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginTop: 20, marginBottom: 8 }}>{block.text}</h3>
    case 'callout':
      return <Callout key={key} block={block} />
    case 'steps':
      return <Steps key={key} block={block} />
    case 'list':
      return <BulletList key={key} block={block} />
    case 'table':
      return <Table key={key} block={block} />
    case 'code':
      return <CodeBlock key={key} block={block} />
    default:
      return null
  }
}

// ─── TOC ────────────────────────────────────────────────────────────────────

function TableOfContents({ sections }: { sections: Section[] }) {
  return (
    <nav
      style={{
        position: 'sticky', top: 24,
        padding: '16px 0',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8, paddingLeft: 12 }}>Neste artigo</p>
      {sections.map(s => (
        <a
          key={s.id}
          href={`#${s.id}`}
          style={{
            display: 'block', padding: '6px 12px', borderRadius: 8,
            fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
            lineHeight: 1.4,
          }}
        >{s.title}</a>
      ))}
    </nav>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HelpArticlePage() {
  const params = useParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug

  const article = useMemo(() => helpArticles.find(a => a.slug === slug), [slug])

  const { prev, next } = useMemo(() => {
    if (!article) return { prev: null, next: null }
    const idx = helpArticles.indexOf(article)
    return {
      prev: idx > 0 ? helpArticles[idx - 1] : null,
      next: idx < helpArticles.length - 1 ? helpArticles[idx + 1] : null,
    }
  }, [article])

  if (!article) {
    return (
      <div className="px-4 py-6 lg:px-8" style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Artigo não encontrado.</p>
        <Link href="/help" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14 }}>← Voltar à Central de Ajuda</Link>
      </div>
    )
  }

  const Icon = iconMap[article.iconName] ?? HelpCircle

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8" style={{ maxWidth: 1040, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: 'var(--text-muted)' }}>
        <Link href="/help" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={14} /> Ajuda
        </Link>
        <ChevronRight size={12} />
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{helpCategories[article.category]}</span>
      </div>

      {/* Layout: content + TOC */}
      <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Article header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                }}
              >
                <Icon size={24} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{article.title}</h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>{article.description}</p>
              </div>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
          </div>

          {/* Sections */}
          {article.sections.map(section => (
            <section key={section.id} id={section.id} style={{ marginBottom: 48, scrollMarginTop: 80 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                {section.title}
              </h2>
              {section.blocks.map((block, i) => renderBlock(block, i))}
            </section>
          ))}

          {/* Prev / Next */}
          <div
            style={{
              display: 'grid', gridTemplateColumns: prev && next ? '1fr 1fr' : '1fr',
              gap: 16, marginTop: 16, paddingTop: 32, borderTop: '1px solid var(--border)',
            }}
          >
            {prev && (
              <Link
                href={`/help/${prev.slug}`}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 4,
                  padding: 16, borderRadius: 12, border: '1px solid var(--border)',
                  background: 'var(--bg-card)', textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>← Anterior</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{prev.title}</span>
              </Link>
            )}
            {next && (
              <Link
                href={`/help/${next.slug}`}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 4, textAlign: prev ? 'right' : 'left',
                  padding: 16, borderRadius: 12, border: '1px solid var(--border)',
                  background: 'var(--bg-card)', textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Próximo →</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{next.title}</span>
              </Link>
            )}
          </div>
        </div>

        {/* TOC — desktop only */}
        <div style={{ width: 200, flexShrink: 0, display: 'none' }} className="help-toc">
          <TableOfContents sections={article.sections} />
        </div>
      </div>
    </div>
  )
}
