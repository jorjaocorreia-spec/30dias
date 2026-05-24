'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Check, Info, Smartphone, Webhook } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export default function IntegrationsPage() {
  const { preferences, setWhatsappNumber } = useAppStore()
  const [phone, setPhone] = useState(preferences.whatsappNumber ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhook/whatsapp?secret=${process.env.NEXT_PUBLIC_WEBHOOK_SECRET ?? '****'}`
    : '/api/webhook/whatsapp?secret=...'

  const handleSave = async () => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10 || cleaned.length > 15) {
      setError('Informe o número com DDD e código do país. Ex: 5511999999999')
      return
    }
    setError('')
    await setWhatsappNumber(cleaned)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold">Integrações</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Conecte o WhatsApp para registrar despesas por mensagem
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
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>via Evolution API</p>
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
            Número pessoal que você usará para enviar mensagens ao bot. Inclua o código do país e DDD sem espaços ou símbolos.
          </p>
          <div className="flex gap-3">
            <input
              type="tel"
              placeholder="5511999999999"
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

        {/* Webhook URL */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Webhook size={14} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium">URL do Webhook</p>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Configure esta URL na Evolution API para que as mensagens cheguem ao app.
          </p>
          <div
            className="p-3 rounded-xl text-xs font-mono break-all select-all"
            style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', userSelect: 'all' }}
          >
            {`https://jorge-7dias.27pl2o.easypanel.host/api/webhook/whatsapp?secret=7dias-webhook-secret-2025`}
          </div>
        </div>

        {/* Como usar */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium">Como registrar despesas</p>
          </div>
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
      </motion.div>

      {/* Setup steps */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-2xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm font-semibold mb-4">Passos para ativar</p>
        <div className="space-y-3">
          {[
            { step: 1, done: true, label: 'Evolution API instalada na VPS' },
            { step: 2, done: true, label: 'API Key da Evolution configurada' },
            { step: 3, done: true, label: 'Criar instância na Evolution API' },
            { step: 4, done: true, label: 'Conectar número do bot via QR Code' },
            { step: 5, done: !!preferences.whatsappNumber, label: 'Cadastrar seu número pessoal acima' },
            { step: 6, done: true, label: 'Configurar webhook na instância' },
          ].map(({ step, done, label, detail }) => (
            <div key={step} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
                style={{
                  background: done ? 'rgba(16,185,129,0.15)' : 'var(--bg-input)',
                  color: done ? '#10b981' : 'var(--text-muted)',
                }}
              >
                {done ? <Check size={12} /> : step}
              </div>
              <div>
                <p className="text-sm" style={{ color: done ? 'var(--text-muted)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>
                  {label}
                </p>
                {detail && !done && (
                  <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>{detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  )
}
