export type Intent =
  | 'expense'
  | 'query_week'
  | 'query_month'
  | 'query_pending'
  | 'query_summary'
  | 'help'

const RULES: { type: Intent; patterns: RegExp[] }[] = [
  {
    type: 'help',
    patterns: [/\bajuda\b/i, /\bcomandos?\b/i, /\bmenu\b/i, /o que (voc[eê]|vc) (faz|pode)/i],
  },
  {
    type: 'query_summary',
    patterns: [/\bresumo\b/i, /como estou/i, /vis[aã]o geral/i],
  },
  {
    type: 'query_week',
    patterns: [/\bsemana\b/i, /\bsemanal\b/i],
  },
  {
    type: 'query_month',
    patterns: [/\bm[eê]s\b/i, /\bmensal\b/i, /\bbal[aã]n[cç]o\b/i],
  },
  {
    type: 'query_pending',
    patterns: [/\ba receber\b/i, /\bpendente/i, /\bpend[eê]ncia/i, /quem me deve/i, /\bcobrar\b/i],
  },
]

export function detectIntent(text: string): Intent {
  for (const rule of RULES) {
    if (rule.patterns.some(p => p.test(text))) return rule.type
  }
  return 'expense'
}
