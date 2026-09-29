const SUFFIX_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000,
}

const AMOUNT_PATTERN = /^(\d+(?:\.\d*)?|\.\d+)([kmb])?$/

// Form inputs always hand us strings; accept how people naturally type money
// ("$10,000", "2.5M") and return null for anything ambiguous rather than NaN.
export function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/[$,\s]/g, '').toLowerCase()
  const match = AMOUNT_PATTERN.exec(cleaned)
  if (!match) {
    return null
  }
  const [, digits = '', suffix] = match
  const value = Number(digits) * (suffix ? (SUFFIX_MULTIPLIERS[suffix] ?? 1) : 1)
  return Number.isFinite(value) ? value : null
}
