import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  // Security headers are applied via next.config.ts
  // Auth protection is handled client-side in (app)/layout.tsx
  // Supabase browser client uses localStorage (not cookies), so
  // server-side session check requires @supabase/ssr — not used here.
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
