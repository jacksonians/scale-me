import { parseAmount } from './parse'
import type { SizingError, SizingField } from './sizing'

const INVALID_AMOUNT_MESSAGES: Record<SizingField, string> = {
  refContracts: 'Enter a whole number, like 500.',
  premium: 'Enter a price, like 2.50.',
  refPortfolio: 'Enter an amount, like 40,000 or 10M.',
  myPortfolio: 'Enter an amount, like 40,000 or 10M.',
}

// Only explain problems with what the user actually typed; blank fields are
// "not yet filled in", not an error.
export function fieldErrorMessage(
  field: SizingField,
  raw: string,
  sizingError: SizingError | undefined,
): string | undefined {
  if (raw.trim() === '') {
    return undefined
  }
  if (parseAmount(raw) === null) {
    return INVALID_AMOUNT_MESSAGES[field]
  }
  switch (sizingError) {
    case 'not-positive':
      return 'Enter an amount above 0.'
    case 'not-whole':
      return 'Enter a whole number of contracts.'
    case 'missing':
    case undefined:
      return undefined
  }
}
