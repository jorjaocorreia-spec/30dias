'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Check, Info, Smartphone } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'

export default function IntegrationsPage() {
  const { preferences, setWhatsappNumber } = useAppStore()
  const [phone, setPhone] = useState(preferences.whatsappNumber ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10 || cleaned.length > 15) {
      setError('Informe apenas DDD + número, sem o código do país. Ex: 45999999999')
      return
    }
    setError('')

    // Query fresh from DB — store may be stale if user deleted the number externally
    const { data: { session } } = await supabase.auth.getSession()
    let isFirstTime = false
    if (session?.user) {
      const { data } = await supabase
        .from('user_preferences')
        .select('whatsapp_number')
        .eq('user_id', session.user.id)
        .single()
      isFirstTime = !data?.whatsapp_number
    }

    await setWhatsappNumber(cleaned)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)

    if (isFirstTime && session?.access_token) {
      fetch('/api/whatsapp/welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ phone: cleaned }),
      }).catch(e => console.error('[welcome]', e))
    }
  }

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold">Integrações</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Registre despesas, receitas e consulte seu financeiro direto pelo WhatsApp
        </p>
      </div>

      {/* WhatsApp card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border overflow-hidden mb-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {/* Card header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(37,211,102,0.15)' }}>
            <MessageCircle size={18} style={{ color: '#25d366' }} />
          </div>
          <div>
            <p className="text-sm font-semibold">WhatsApp</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Registre despesas, receitas e consulte seu financeiro</p>
          </div>
          <div className="ml-auto">
            {preferences.whatsappNumber ? (
              <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                Configurado
              </span>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                Pendente
              </span>
            )}
          </div>
        </div>

        {/* Número pessoal */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Smartphone size={14} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium">Seu número de WhatsApp</p>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Número pessoal que você usará para enviar mensagens ao bot. Informe apenas DDD + número, sem o código do país (55). Sem espaços ou símbolos.
          </p>
          <div className="flex gap-3">
            <input
              type="tel"
              placeholder="45999999999"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="flex-1 rounded-xl text-sm"
              style={{
                padding: '10px 14px',
                background: 'var(--bg-input)',
                border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
                color: 'var(--text)',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSave}
              className="px-5 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{
                background: saved ? '#10b981' : 'linear-gradient(135deg, #10b981, #06b6d4)',
                color: '#fff',
                cursor: 'pointer',
                border: 'none',
                minWidth: 88,
                justifyContent: 'center',
                transition: 'background 0.3s',
              }}
            >
              {saved ? <><Check size={14} /> Salvo!</> : 'Salvar'}
            </button>
          </div>
          {error && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{error}</p>}
        </div>

        {/* Registrar despesas */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium">Registrar despesas</p>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Mande uma mensagem descrevendo o gasto — o bot entende linguagem natural.
          </p>
          <div className="space-y-2">
            {[
              { msg: 'gastei 47 reais no mercado', resp: '✅ R$ 47,00 · Alimentação · 21/05' },
              { msg: 'paguei a academia 90 reais no cartão', resp: '✅ R$ 90,00 · Saúde · 21/05' },
              { msg: 'uber 18,50 pix', resp: '✅ R$ 18,50 · Transporte · 21/05' },
            ].map(({ msg, resp }) => (
              <div key={msg} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-3 py-2 text-xs" style={{ background: 'rgba(37,211,102,0.06)', color: 'var(--text-muted)' }}>
                  📱 <span style={{ color: 'var(--text)' }}>{msg}</span>
                </div>
                <div className="px-3 py-2 text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                  🤖 {resp}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registrar receitas */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium">Registrar receitas</p>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Use palavras como <span style={{ color: 'var(--text)' }}>recebi, recebimento, ganhei</span> ou <span style={{ color: 'var(--text)' }}>entrou</span> para registrar uma receita. O bot salva automaticamente na categoria certa.
          </p>
          <div className="space-y-2">
            {[
              { msg: 'recebi 150 do IRPF', resp: '✅ +R$ 150,00 · Investimentos · 29/05' },
              { msg: 'recebimento 2000 salário via ted', resp: '✅ +R$ 2.000,00 · Salário · 29/05' },
              { msg: 'ganhei 500 de freela no pix', resp: '✅ +R$ 500,00 · Freelance · 29/05' },
            ].map(({ msg, resp }) => (
              <div key={msg} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-3 py-2 text-xs" style={{ background: 'rgba(139,92,246,0.06)', color: 'var(--text-muted)' }}>
                  📱 <span style={{ color: 'var(--text)' }}>{msg}</span>
                </div>
                <div className="px-3 py-2 text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                  🤖 {resp}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registro por áudio */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium">Registro por áudio 🎙️</p>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Não precisa digitar — mande um <span style={{ color: 'var(--text)' }}>áudio no WhatsApp</span> descrevendo o gasto ou receita. O bot transcreve e registra automaticamente. Funciona exatamente igual às mensagens de texto.
          </p>
          <div className="space-y-2">
            {[
              { msg: '🎙️ [áudio] "gastei oitenta reais no supermercado no pix"', resp: '✅ R$ 80,00 · Alimentação · 31/05' },
              { msg: '🎙️ [áudio] "paguei a conta de luz cento e cinquenta reais"', resp: '✅ R$ 150,00 · Contas · 31/05' },
              { msg: '🎙️ [áudio] "recebi dois mil de salário via ted"', resp: '✅ +R$ 2.000,00 · Salário · 31/05' },
            ].map(({ msg, resp }) => (
              <div key={msg} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-3 py-2 text-xs" style={{ background: 'rgba(139,92,246,0.06)', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--text)' }}>{msg}</span>
                </div>
                <div className="px-3 py-2 text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                  🤖 {resp}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consultas disponíveis */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium">Consultas disponíveis</p>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Além de registrar, você pode consultar seu financeiro direto pelo chat.
          </p>
          <div className="space-y-2">
            {[
              {
                cmd: 'semana',
                desc: 'Saldo da semana atual',
                resp: '📊 Semana atual · Gasto: R$ 450 · Disponível: R$ 550 (55% livre)',
              },
              {
                cmd: 'mês',
                desc: 'Balanço do mês corrente',
                resp: '📅 Maio 2026 · Receitas: R$ 5.000 · Despesas: R$ 2.800 · Saldo: R$ 2.200',
              },
              {
                cmd: 'a receber',
                desc: 'Valores pendentes de participantes',
                resp: '💳 A receber · João → R$ 50 · Maria → R$ 30 · Total: R$ 80',
              },
              {
                cmd: 'resumo',
                desc: 'Visão compacta de semana + mês',
                resp: '📊 Semana: R$ 450 de R$ 1.000 · 📅 Maio: saldo R$ 2.200',
              },
              {
                cmd: 'ajuda',
                desc: 'Lista todos os comandos disponíveis',
                resp: '🤖 30dias — Comandos disponíveis...',
              },
            ].map(({ cmd, desc, resp }) => (
              <div key={cmd} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 px-3 py-2"
                  style={{ background: 'rgba(6,182,212,0.06)', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                    style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}>
                    {cmd}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</span>
                </div>
                <div className="px-3 py-2 text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                  🤖 {resp}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Mensagens com <span style={{ color: 'var(--text)' }}>recebi, recebimento, ganhei</span> ou <span style={{ color: 'var(--text)' }}>entrou</span> são salvas como receita. Qualquer outra é interpretada como despesa.
          </p>
        </div>
      </motion.div>

    </div>
  )
}
