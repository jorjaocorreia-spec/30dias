const EVOLUTION_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY!
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE!

async function downloadAudioBase64(messageData: any): Promise<{ base64: string; mimetype: string }> {
  const res = await fetch(
    `${EVOLUTION_URL}/chat/getBase64FromMediaMessage/${EVOLUTION_INSTANCE}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_KEY,
      },
      body: JSON.stringify({ message: messageData, convertToMp4: false }),
    },
  )

  if (!res.ok) {
    throw new Error(`Evolution download error: ${res.status} ${await res.text()}`)
  }

  const json = await res.json()
  if (!json.base64) throw new Error('No base64 in Evolution API response')

  return { base64: json.base64, mimetype: (json.mimetype as string) ?? 'audio/ogg' }
}

async function transcribeWithGroq(base64: string, mimetype: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64')
  // Whisper accepts ogg/opus — strip codec params from mimetype for the Blob
  const blob = new Blob([buffer], { type: mimetype.split(';')[0] })

  const formData = new FormData()
  formData.append('file', blob, 'audio.ogg')
  formData.append('model', 'whisper-large-v3-turbo')
  formData.append('language', 'pt')
  formData.append('response_format', 'text')

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: formData,
  })

  if (!res.ok) {
    throw new Error(`Groq transcription error: ${res.status} ${await res.text()}`)
  }

  return (await res.text()).trim()
}

export async function getTranscriptionFromAudioMessage(messageData: any): Promise<string> {
  const { base64, mimetype } = await downloadAudioBase64(messageData)
  return transcribeWithGroq(base64, mimetype)
}
