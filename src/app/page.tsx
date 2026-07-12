'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Eye, EyeOff, MessageCircle, BarChart3, Target, Wallet,
  TrendingUp, Repeat, Lock, RotateCcw, CreditCard, Check, ChevronDown,
  Star, Calendar, X,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const C = {
  bg: '#0d0d0d',
  surface: '#141414',
  surface2: '#1a1a1a',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.15)',
  accent: '#10b981',
  accent2: '#06b6d4',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  textFaint: '#64748b',
  gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
}

const painPoints = [
  'Todo mês termina sem saber pra onde foi o dinheiro',
  'Você quer economizar, mas não sabe por onde começar',
  'Já tentou planilha, já tentou app — nada durou mais de uma semana',
  'Fica com aquela sensação de culpa sem conseguir mudar nada',
  'Não tem tempo pra ficar abrindo app toda hora pra lançar gasto',
  'O salário cai, as contas chegam, e sobra menos do que deveria',
]

const solutionCards = [
  { icon: MessageCircle, title: 'Manda no WhatsApp', desc: 'Gastou no mercado? Só mandar "mercado 87,50". O bot registra na hora.' },
  { icon: BarChart3, title: 'Veja tudo no dashboard', desc: 'Acesse o painel e veja exatamente pra onde foi cada centavo, por categoria.' },
  { icon: Target, title: 'Defina metas e acompanhe', desc: 'Crie orçamentos por categoria e receba alertas antes de estourar.' },
]

const features = [
  { icon: MessageCircle, title: 'Bot no WhatsApp', desc: 'Registre gastos em segundos sem sair do app que você já usa.' },
  { icon: BarChart3, title: 'Dashboard completo', desc: 'Gráficos de gastos por categoria em tempo real.' },
  { icon: Target, title: 'Metas financeiras', desc: 'Defina objetivos e veja seu progresso semana a semana.' },
  { icon: Wallet, title: 'Orçamento mensal', desc: 'Limite por categoria com alertas automáticos.' },
  { icon: TrendingUp, title: 'Projeção do mês', desc: 'Saiba quanto vai gastar antes do fim do mês.' },
  { icon: Repeat, title: 'Despesas fixas', desc: 'Cadastre uma vez, o sistema lança todo mês.' },
]

const steps = [
  { n: '1', title: 'Assine o 30dias', desc: 'Cria sua conta em 2 minutos.' },
  { n: '2', title: 'Conecte o WhatsApp', desc: 'Adiciona o bot nos seus contatos.' },
  { n: '3', title: 'Manda o primeiro gasto', desc: 'Digite "mercado 45,00" e pronto.' },
]

const testimonials = [
  { quote: 'Economizei mais de R$ 400 já no primeiro mês só de ver onde o dinheiro estava vazando.', name: 'Camila R.', role: 'Usuária desde 2025' },
  { quote: 'Eu não abro app nenhum. Só mando mensagem no WhatsApp e o resto o 30dias faz.', name: 'Diego M.', role: 'Autônomo' },
  { quote: 'Antes eu vivia no escuro com as finanças. Hoje sei exatamente quanto posso gastar até o fim do mês.', name: 'Patrícia A.', role: 'Usuária desde 2025' },
]

const objections = [
  { q: 'Já tentei app financeiro e não continuei usando', a: 'A maioria falha porque exige disciplina de abrir o app. O 30dias funciona no WhatsApp que você já abre 50x por dia.' },
  { q: 'R$ 19,90 é mais um gasto', a: 'Se o 30dias te ajudar a economizar só R$ 50/mês — o que é bem conservador — você tem ROI de 2,5x. E tem 30 dias pra ver.' },
  { q: 'Não tenho tempo pra aprender uma plataforma nova', a: 'Você já sabe usar o WhatsApp. O setup leva 2 minutos. Não tem curva de aprendizado.' },
  { q: 'Meus dados financeiros vão ficar seguros?', a: 'Seus dados são criptografados e nunca compartilhados. Você tem controle total.' },
]

const faqs = [
  { q: 'Como funciona o bot do WhatsApp?', a: 'Você adiciona o número do 30dias nos contatos e começa a mandar mensagens com seus gastos. Ex: "mercado 87,50" ou "uber 23,00". O bot registra e já te dá o saldo do orçamento.' },
  { q: 'Precisa instalar algum app?', a: 'Não. O 30dias funciona pelo WhatsApp (que você já tem) + uma plataforma web acessível pelo navegador do celular ou computador.' },
  { q: 'E se eu não gostar?', a: 'Você tem 30 dias de garantia. Se não ficar satisfeito, devolvemos 100% sem perguntas.' },
  { q: 'Como funciona o cancelamento?', a: 'Só entrar em contato e cancelamos na hora. Sem multa, sem carência, sem burocracia.' },
  { q: 'Posso lançar despesas fixas?', a: 'Sim. Cadastra uma vez (aluguel, internet, academia) e o sistema lança automaticamente todo mês.' },
  { q: 'Tem aplicativo mobile?', a: 'O 30dias é web-first, acessível de qualquer dispositivo pelo navegador. E o bot do WhatsApp é sua interface mobile principal.' },
]

const navLinks = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#preco', label: 'Preço' },
  { href: '#faq', label: 'FAQ' },
]

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function LandingPage() {
  const { isAuthenticated, login, signup, loginWithGoogle } = useAppStore()
  const router = useRouter()

  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [authOpen, setAuthOpen] = useState(false)

  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openAuth = (m: 'login' | 'signup') => {
    setMode(m)
    setError('')
    setAuthOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')

    const fn = mode === 'login' ? login : signup
    const { error: err } = await fn(email, password)

    if (err) {
      setError(translateError(err))
      setLoading(false)
    } else if (mode === 'signup') {
      setError('Conta criada! Verifique seu email para confirmar antes de entrar.')
      setLoading(false)
      setMode('login')
      setPassword('')
    } else {
      setTimeout(() => setLoading(false), 5000)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    await loginWithGoogle()
  }

  return (
    <div className={inter.variable} style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'var(--font-inter), sans-serif' }}>
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        .ld-btn-primary { transition: transform 0.15s, box-shadow 0.15s; }
        .ld-btn-primary:hover { transform: scale(1.03); }
        .ld-card { transition: transform 0.2s, border-color 0.2s; }
        .ld-card:hover { transform: translateY(-4px); border-color: ${C.borderHover}; }
        .ld-nav-link { transition: color 0.15s; }
        .ld-nav-link:hover { color: ${C.text} !important; }
        .ld-faq-q { transition: background 0.15s; }
        .ld-faq-q:hover { background: ${C.surface2}; }
        .ld-chevron { transition: transform 0.2s; }
        .ld-chevron.open { transform: rotate(180deg); }
        @media (max-width: 768px) {
          .ld-nav-links { display: none !important; }
        }
        @keyframes ld-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 64,
        background: scrolled ? 'rgba(13,13,13,0.75)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all 0.25s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: C.gradient,
          }}>
            <Calendar size={16} color="#fff" />
          </div>
          <span style={{
            fontWeight: 800, fontSize: 18,
            background: C.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>30dias</span>
        </div>

        <nav className="ld-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {navLinks.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="ld-nav-link"
              onClick={e => { e.preventDefault(); scrollToId(l.href.slice(1)) }}
              style={{ color: C.textMuted, fontSize: 14, fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          onClick={() => openAuth('signup')}
          className="ld-btn-primary"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: C.gradient, color: '#fff', fontWeight: 600, fontSize: 14,
          }}
        >
          Começar agora
        </button>
      </header>

      {/* ── HERO ── */}
      <section style={{ padding: '72px 24px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <motion.div
          style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        >
          <h1 style={{ fontSize: 'clamp(34px, 6vw, 60px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.02em' }}>
            Chega de fim de mês surpresa.<br />
            <span style={{ background: C.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              Assuma o controle em 5 minutos.
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.textMuted, maxWidth: 520, marginBottom: 36, lineHeight: 1.6 }}>
            O 30dias conecta com o WhatsApp que você já usa todo dia. Manda uma mensagem, a gente registra. Simples assim.
          </p>

          <button
            onClick={() => openAuth('signup')}
            className="ld-btn-primary"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '16px 36px', borderRadius: 12,
              background: C.gradient,
              color: '#fff', fontWeight: 700, fontSize: 16, border: 'none',
              cursor: 'pointer', boxShadow: '0 0 36px rgba(16,185,129,0.35)',
            }}
          >
            Quero controlar meu dinheiro <ArrowRight size={18} />
          </button>
          <p style={{ fontSize: 13, color: C.textFaint, marginTop: 14 }}>
            R$ 19,90/mês • Cancele quando quiser
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
          style={{
            marginTop: 56, width: '100%', maxWidth: 360, textAlign: 'left',
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: 24, boxShadow: '0 16px 56px rgba(0,0,0,0.4)',
          }}
        >
          <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, fontWeight: 600, letterSpacing: '0.02em' }}>RESUMO DO MÊS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Row label="Receitas" value="R$ 5.200,00" color={C.accent} />
            <Row label="Despesas" value="R$ 3.100,00" color="#f43f5e" />
            <div style={{ height: 1, background: C.border }} />
            <Row label="Saldo" value="R$ 2.100,00" color={C.accent2} bold />
          </div>
        </motion.div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '20px 24px' }}>
        <div style={{
          maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap',
          justifyContent: 'center', gap: '12px 40px',
        }}>
          {[
            'Controle total em menos de 5 min por dia',
            'Bot 24h no WhatsApp',
            'R$ 19,90/mês sem surpresa',
          ].map(t => (
            <span key={t} style={{ fontSize: 13, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: C.accent }}>✦</span> {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── DOR ── */}
      <Section>
        <Heading center>Você se identifica com algum desses?</Heading>
        <div style={{ maxWidth: 760, margin: '40px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {painPoints.map((p, i) => (
            <Reveal key={p} delay={i * 0.05}>
              <div style={{
                display: 'flex', gap: 10, padding: '16px 18px', borderRadius: 16,
                background: C.surface, border: `1px solid ${C.border}`,
              }}>
                <span style={{ color: '#f43f5e', fontWeight: 700, flexShrink: 0 }}>✕</span>
                <span style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.5 }}>{p}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── SOLUÇÃO ── */}
      <Section>
        <Heading center>O 30dias foi feito pra quem não tem tempo de cuidar das finanças</Heading>
        <p style={{ textAlign: 'center', color: C.textMuted, fontSize: 15, marginTop: 12 }}>
          Você usa o WhatsApp mesmo. A gente só aproveita isso.
        </p>
        <div style={{ maxWidth: 920, margin: '40px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {solutionCards.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 0.1}>
              <div className="ld-card" style={{ padding: 28, borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`, height: '100%' }}>
                <IconBadge Icon={Icon} />
                <p style={{ fontWeight: 700, fontSize: 16, marginTop: 16, marginBottom: 8 }}>{title}</p>
                <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── FUNCIONALIDADES ── */}
      <Section id="funcionalidades">
        <Heading center>Tudo que você precisa, nada que você não vai usar</Heading>
        <div style={{ maxWidth: 1000, margin: '40px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {features.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="ld-card" style={{ padding: 24, borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`, height: '100%' }}>
                <IconBadge Icon={Icon} small />
                <p style={{ fontWeight: 600, fontSize: 15, marginTop: 14, marginBottom: 6 }}>{title}</p>
                <p style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.55 }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── COMO FUNCIONA ── */}
      <Section id="como-funciona">
        <Heading center>Comece a controlar hoje mesmo</Heading>
        <div style={{
          maxWidth: 880, margin: '48px auto 0', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, position: 'relative',
        }}>
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: C.gradient, color: '#fff', fontWeight: 800, fontSize: 18,
                }}>{s.n}</div>
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{s.title}</p>
                <p style={{ fontSize: 13.5, color: C.textMuted }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── MOCKUP WHATSAPP ── */}
      <Section>
        <Heading center>Registrar gasto fica tão fácil quanto mandar mensagem</Heading>
        <Reveal>
          <div style={{
            maxWidth: 420, margin: '40px auto 0', borderRadius: 20, overflow: 'hidden',
            background: C.surface, border: `1px solid ${C.border}`,
          }}>
            <div style={{ padding: '14px 18px', background: C.surface2, display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={16} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>30dias Bot</p>
                <p style={{ fontSize: 11, color: C.accent }}>online</p>
              </div>
            </div>
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, background: '#0a0a0a' }}>
              <Bubble who="user">mercado 87,50</Bubble>
              <Bubble who="bot">✅ Registrado! Mercado — R$ 87,50. Saldo do orçamento de Alimentação: R$ 312,50 restantes.</Bubble>
              <Bubble who="user">uber 23,00</Bubble>
              <Bubble who="bot">✅ Registrado! Transporte — R$ 23,00. Você já usou 67% do orçamento de Transporte este mês.</Bubble>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ── PROVA SOCIAL ── */}
      <Section>
        <Heading center>O que nossos usuários dizem</Heading>
        <div style={{ maxWidth: 1000, margin: '40px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div style={{ padding: 24, borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`, height: '100%' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={14} fill={C.accent} color={C.accent} />)}
                </div>
                <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 18 }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: C.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13,
                  }}>{t.name.charAt(0)}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: C.textFaint }}>{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── PRICING ── */}
      <Section id="preco">
        <Heading center>Um investimento menor que um café por dia</Heading>
        <Reveal>
          <div style={{
            maxWidth: 380, margin: '40px auto 0', borderRadius: 20, padding: 32,
            background: C.surface, border: `1px solid ${C.accent}`,
            boxShadow: '0 0 60px rgba(16,185,129,0.15)', textAlign: 'center',
          }}>
            <span style={{
              display: 'inline-block', padding: '5px 14px', borderRadius: 100, marginBottom: 18,
              background: 'rgba(16,185,129,0.15)', color: C.accent, fontSize: 12, fontWeight: 700,
            }}>Plano Completo</span>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 44, fontWeight: 800 }}>R$ 19,90</span>
              <span style={{ fontSize: 15, color: C.textMuted }}>/mês</span>
            </div>
            <p style={{ fontSize: 13, color: C.textFaint, marginBottom: 24 }}>Menos de R$ 0,67 por dia</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', marginBottom: 28 }}>
              {[
                'Bot WhatsApp ilimitado',
                'Dashboard completo',
                'Metas e orçamentos',
                'Projeção do mês',
                'Despesas fixas automáticas',
                'Suporte por chat',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Check size={16} color={C.accent} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: C.text }}>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => openAuth('signup')}
              className="ld-btn-primary"
              style={{
                width: '100%', padding: '15px 16px', borderRadius: 12, border: 'none',
                background: C.gradient, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                boxShadow: '0 0 30px rgba(16,185,129,0.3)',
              }}
            >
              Assinar agora →
            </button>
            <p style={{ fontSize: 12, color: C.textFaint, marginTop: 14 }}>Cancele quando quiser. Sem multa, sem burocracia.</p>
          </div>
        </Reveal>
      </Section>

      {/* ── QUEBRA DE OBJEÇÕES ── */}
      <Section>
        <Heading center>Antes de fechar a aba...</Heading>
        <div style={{ maxWidth: 720, margin: '40px auto 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {objections.map((o, i) => (
            <Reveal key={o.q} delay={i * 0.06}>
              <div style={{ padding: 20, borderRadius: 16, background: C.surface, border: `1px solid ${C.border}` }}>
                <p style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 8, color: C.textMuted }}>&ldquo;{o.q}&rdquo;</p>
                <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{o.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── GARANTIA ── */}
      <Section>
        <Reveal>
          <div style={{
            maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: 36, borderRadius: 20,
            background: C.surface2, border: `1px solid ${C.border}`,
          }}>
            <Heading center>30 dias de garantia incondicional</Heading>
            <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.7, marginTop: 14, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
              Se em 30 dias você não sentir que tem mais controle sobre seu dinheiro, devolvemos 100% do valor. Sem perguntas, sem burocracia.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, marginTop: 28 }}>
              <Seal icon={Lock} label="Dados Seguros" />
              <Seal icon={RotateCcw} label="Garantia 30 dias" />
              <Seal icon={CreditCard} label="Cancele Quando Quiser" />
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ── URGÊNCIA ── */}
      <Section>
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
            <Heading center>Quanto você perdeu esse mês por não saber pra onde foi o dinheiro?</Heading>
            <p style={{ fontSize: 15, color: C.textMuted, marginTop: 14, marginBottom: 28 }}>
              Cada dia sem controle é dinheiro que não volta. Comece hoje.
            </p>
            <button
              onClick={() => openAuth('signup')}
              className="ld-btn-primary"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '15px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: C.gradient, color: '#fff', fontWeight: 700, fontSize: 15,
                boxShadow: '0 0 30px rgba(16,185,129,0.3)',
              }}
            >
              Quero controlar meu dinheiro agora <ArrowRight size={16} />
            </button>
          </div>
        </Reveal>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq">
        <Heading center>Perguntas frequentes</Heading>
        <div style={{ maxWidth: 680, margin: '40px auto 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((f, i) => {
            const open = openFaq === i
            return (
              <div key={f.q} style={{ borderRadius: 16, background: C.surface, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="ld-faq-q"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: C.text }}>{f.q}</span>
                  <ChevronDown size={18} className={`ld-chevron${open ? ' open' : ''}`} style={{ color: C.textMuted, flexShrink: 0 }} />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p style={{ padding: '0 20px 18px', fontSize: 13.5, color: C.textMuted, lineHeight: 1.6 }}>{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── CTA FINAL ── */}
      <Section>
        <Reveal>
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, lineHeight: 1.25, marginBottom: 14 }}>
              Seu dinheiro merece mais atenção do que você tem dado a ele.
            </h2>
            <p style={{ fontSize: 15, color: C.textMuted, marginBottom: 28 }}>Comece hoje. Menos de R$ 1 por dia.</p>
            <button
              onClick={() => openAuth('signup')}
              className="ld-btn-primary"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '16px 36px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: C.gradient, color: '#fff', fontWeight: 700, fontSize: 16,
                boxShadow: '0 0 36px rgba(16,185,129,0.35)',
              }}
            >
              Começar agora por R$ 19,90/mês <ArrowRight size={18} />
            </button>
          </div>
        </Reveal>
      </Section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '36px 24px' }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto', display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.gradient }}>
              <Calendar size={13} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.textMuted }}>30dias</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: C.textFaint }}>
            <span>Política de Privacidade</span>
            <span>Termos de Uso</span>
            <span>Contato</span>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: C.textFaint, marginTop: 24 }}>
          © 2026 30dias. Todos os direitos reservados.
        </p>
        <p style={{ textAlign: 'center', fontSize: 11.5, color: C.textFaint, marginTop: 8, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
          Ao assinar, você concorda com nossa Política de Privacidade e com o tratamento dos seus dados conforme a LGPD.
        </p>
      </footer>

      {/* ── AUTH MODAL ── */}
      <AnimatePresence>
        {authOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAuthOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.6)' }}
            />
            <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  pointerEvents: 'auto', width: '100%', maxWidth: 380, borderRadius: 20, padding: 28,
                  background: C.surface2, border: `1px solid ${C.border}`, position: 'relative',
                  maxHeight: '90vh', overflowY: 'auto',
                }}
              >
                <button
                  onClick={() => setAuthOpen(false)}
                  style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, display: 'flex' }}
                >
                  <X size={18} />
                </button>

                <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 24 }}>
                  {mode === 'login' ? 'Entrar na plataforma' : 'Criar conta'}
                </h2>

                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '13px 16px', borderRadius: 12, marginBottom: 16,
                    background: C.surface, border: `1px solid ${C.border}`, color: C.text,
                    fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar com Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ fontSize: 12, color: C.textMuted }}>ou</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 12,
                      background: C.surface, border: `1px solid ${C.border}`, color: C.text,
                      fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    }}
                  />

                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Senha"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '13px 44px 13px 16px', borderRadius: 12,
                        background: C.surface, border: `1px solid ${C.border}`, color: C.text,
                        fontSize: 14, outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, display: 'flex' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {error && (
                    <p style={{ fontSize: 13, color: 'var(--red)', textAlign: 'center', padding: '8px 12px', borderRadius: 10, background: 'rgba(244,63,94,0.1)' }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 12, marginTop: 4, border: 'none',
                      background: C.gradient, color: '#fff', fontWeight: 600, fontSize: 14,
                      cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
                  </button>
                </form>

                <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 20 }}>
                  {mode === 'login' ? (
                    <>Não tem conta?{' '}
                      <button onClick={() => { setMode('signup'); setError('') }} style={{ color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                        Criar agora
                      </button>
                    </>
                  ) : (
                    <>Já tem conta?{' '}
                      <button onClick={() => { setMode('login'); setError('') }} style={{ color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                        Entrar
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
  return <section id={id} style={{ padding: '64px 24px', borderTop: `1px solid ${C.border}` }}>{children}</section>
}

function Heading({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <h2 style={{
      fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, lineHeight: 1.25,
      textAlign: center ? 'center' : 'left', letterSpacing: '-0.01em',
    }}>{children}</h2>
  )
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  )
}

function IconBadge({ Icon, small }: { Icon: React.ComponentType<{ size?: number; color?: string }>; small?: boolean }) {
  const size = small ? 36 : 44
  return (
    <div style={{
      width: size, height: size, borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(16,185,129,0.12)',
    }}>
      <Icon size={small ? 17 : 20} color={C.accent} />
    </div>
  )
}

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: C.textMuted }}>{label}</span>
      <span style={{ fontSize: bold ? 17 : 14, fontWeight: bold ? 800 : 600, color }}>{value}</span>
    </div>
  )
}

function Bubble({ who, children }: { who: 'user' | 'bot'; children: React.ReactNode }) {
  const isUser = who === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '78%', padding: '9px 13px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.5,
        background: isUser ? C.gradient : C.surface2,
        color: isUser ? '#fff' : C.text,
        border: isUser ? 'none' : `1px solid ${C.border}`,
      }}>
        {children}
      </div>
    </div>
  )
}

function Seal({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number; color?: string }>; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={16} color={C.accent} />
      <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>{label}</span>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos.'
  if (msg.includes('Email not confirmed')) return 'Confirme seu email antes de entrar.'
  if (msg.includes('User already registered')) return 'Este email já está cadastrado.'
  if (msg.includes('Password should be')) return 'A senha deve ter no mínimo 6 caracteres.'
  return msg
}
