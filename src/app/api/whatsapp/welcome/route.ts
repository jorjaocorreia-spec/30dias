import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage'
import { getWelcomeMessage } from '@/lib/whatsapp/queryHandlers'

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  if (digits.length === 10 || digits.length === 11) return '55' + digits
  return digits
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const phone: string = body?.phone ?? ''
  if (!phone) {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 })
  }

  await sendWhatsAppMessage(normalizePhone(phone), getWelcomeMessage())
  return NextResponse.json({ ok: true })
}
