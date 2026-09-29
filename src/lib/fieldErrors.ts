import { parseAmount } from './parse'
import type { SizingError, SizingField } from './sizing'

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
    return field === 'refContracts' ? 'Enter a whole number, like 500.' : 'Enter an amount, like 2.50 or 10M.'
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
