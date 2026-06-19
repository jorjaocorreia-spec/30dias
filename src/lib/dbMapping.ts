const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDB<T>(row: Record<string, any>): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {}
  for (const key of Object.keys(row)) {
    if (key === 'user_id') continue
    const val = row[key]
    result[toCamel(key)] = val === null ? undefined : val
  }
  return result as T
}
