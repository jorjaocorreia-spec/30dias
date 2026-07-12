import { CSSProperties } from 'react'

interface MoneyProps {
  value: string
  className?: string
  style?: CSSProperties
}

/** Renders a pre-formatted monetary/percentage string in the design system's mono font (The Money-Is-Mono Rule). */
export function Money({ value, className, style }: MoneyProps) {
  return (
    <span className={className} style={{ fontFamily: 'var(--font-dm-mono)', ...style }}>
      {value}
    </span>
  )
}
