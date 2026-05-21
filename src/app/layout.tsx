import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: '7Dias — Controle financeiro semanal',
  description: 'Seu dinheiro. A cada 7 dias.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // "dark" aplicado por padrão no servidor para evitar flash — ThemeProvider sincroniza com a preferência salva
    <html lang="pt-BR" className={`${geistSans.variable} dark`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
