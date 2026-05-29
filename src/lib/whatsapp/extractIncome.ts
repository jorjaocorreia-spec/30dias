import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ExtractedIncome {
  amount: number
  description: string
  categoryId: string
  paymentMethod: 'credit_card' | 'pix' | 'ted' | 'cash'
  receivedDate: string  // YYYY-MM-DD
}

export type IncomeExtractionResult =
  | { success: true; income: ExtractedIncome }
  | { success: false; reason: string }

interface IncomeCategory { id: string; name: string }

function getBRTDateStr(): string {
  const brt = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const y = brt.getUTCFullYear()
  const m = String(brt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(brt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function extractIncome(
  message: string,
  categories: IncomeCategory[],
): Promise<IncomeExtractionResult> {
  const today = getBRTDateStr()

  const systemPrompt = `Você é um assistente de finanças pessoais. Extraia dados de receita/recebimento de mensagens em português.

Categorias disponíveis (use o id exato):
${categories.map(c => `- ${c.id}: ${c.name}`).join('\n')}

Hoje é ${today}.

Responda APENAS com JSON válido, sem markdown, sem explicações.

Se conseguir extrair:
{"success":true,"amount":150.00,"description":"Restituição IRPF","categoryId":"income-other","paymentMethod":"pix","receivedDate":"${today}"}

Se não conseguir (valor ausente ou mensagem não é uma receita):
{"success":false,"reason":"Não identifiquei o valor recebido. Tente: 'recebi 150 reais do cliente via pix'"}

Regras:
- amount: obrigatório, número positivo. Se ausente → success:false
- description: resumo curto e claro da receita
- categoryId: escolha a categoria mais adequada (income-salary para salário/pagamento, income-investments para IRPF/dividendos/rendimentos, income-freelance para serviços/freela, income-rent para aluguel, income-sales para vendas, income-other para o resto)
- paymentMethod: deduza pelo contexto (pix, cartão=credit_card, ted, dinheiro=cash) — padrão: "pix"
- receivedDate: hoje (${today}) salvo se o usuário mencionar outro dia`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: systemPrompt,
    messages: [{ role: 'user', content: message }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  console.log('[WA] income claude raw:', raw)

  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    const parsed = JSON.parse(text)
    if (parsed.success === true && typeof parsed.amount === 'number' && parsed.amount > 0) {
      return {
        success: true,
        income: {
          amount: parsed.amount,
          description: parsed.description ?? message.slice(0, 60),
          categoryId: parsed.categoryId ?? categories[0]?.id ?? 'income-other',
          paymentMethod: parsed.paymentMethod ?? 'pix',
          receivedDate: parsed.receivedDate ?? today,
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
