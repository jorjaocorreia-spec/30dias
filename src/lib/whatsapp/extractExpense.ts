import Anthropic from '@anthropic-ai/sdk'
import { getTodayKey } from '@/lib/weekHelpers'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ExtractedExpense {
  amount: number
  description: string
  categoryId: string
  establishmentId?: string
  paymentMethod: 'credit_card' | 'pix' | 'ted' | 'cash'
  date: string  // YYYY-MM-DD
}

export type ExtractionResult =
  | { success: true; expense: ExtractedExpense }
  | { success: false; reason: string }

interface Category { id: string; name: string }
interface Establishment { id: string; name: string; categoryId: string }

export async function extractExpense(
  message: string,
  categories: Category[],
  establishments: Establishment[],
): Promise<ExtractionResult> {
  const today = getTodayKey()

  const systemPrompt = `Você é um assistente de finanças pessoais. Extraia dados de despesa de mensagens em português.

Categorias disponíveis (use o id exato):
${categories.map(c => `- ${c.id}: ${c.name}`).join('\n')}

Estabelecimentos disponíveis (use o id exato, opcional):
${establishments.length > 0
  ? establishments.map(e => `- ${e.id}: ${e.name}`).join('\n')
  : '(nenhum cadastrado)'}

Hoje é ${today}.

Responda APENAS com JSON válido, sem markdown, sem explicações.

Se conseguir extrair:
{"success":true,"amount":47.50,"description":"Almoço no restaurante","categoryId":"food","establishmentId":"est-123","paymentMethod":"pix","date":"${today}"}

Se não conseguir (valor ausente ou mensagem não é uma despesa):
{"success":false,"reason":"Não identifiquei o valor da despesa. Tente: 'gastei 47 reais no mercado'"}

Regras:
- amount: obrigatório, número positivo. Se ausente → success:false
- description: resumo curto e claro da despesa
- categoryId: escolha a categoria mais adequada pelo contexto
- establishmentId: só preencha se o nome do estabelecimento bater com um da lista
- paymentMethod: deduza pelo contexto (pix, cartão, dinheiro) — padrão: "pix"
- date: hoje (${today}) salvo se o usuário mencionar outro dia`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: systemPrompt,
    messages: [{ role: 'user', content: message }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  try {
    const parsed = JSON.parse(text)
    if (parsed.success === true && typeof parsed.amount === 'number' && parsed.amount > 0) {
      return {
        success: true,
        expense: {
          amount: parsed.amount,
          description: parsed.description ?? message.slice(0, 60),
          categoryId: parsed.categoryId ?? categories[0]?.id ?? 'other',
          establishmentId: parsed.establishmentId ?? undefined,
          paymentMethod: parsed.paymentMethod ?? 'pix',
          date: parsed.date ?? today,
        },
      }
    }
    return {
      success: false,
      reason: parsed.reason ?? 'Não consegui entender a mensagem.',
    }
  } catch {
    return { success: false, reason: 'Erro ao processar a mensagem. Tente novamente.' }
  }
}
