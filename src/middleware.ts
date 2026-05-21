import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/auth/callback']
const PROTECTED_PREFIX = ['/dashboard', '/expenses', '/categories', '/establishments', '/fixed-expenses', '/income', '/summary', '/budget']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIX.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // Supabase armazena sessão em cookie sb-*-auth-token
  const hasSession = Array.from(request.cookies.getAll()).some(c =>
    c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  if (!hasSession) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
