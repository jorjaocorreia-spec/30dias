const EVOLUTION_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY!
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE!

export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const url = `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: to,
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`Evolution API error ${res.status}:`, body)
  }
}
