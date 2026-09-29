import { describe, expect, it } from 'vitest'
import { parseAmount } from './parse'

describe('parseAmount', () => {
  it.each([
    ['500', 500],
    ['2.5', 2.5],
    ['.75', 0.75],
    ['0', 0],
    ['1,250.50', 1250.5],
    ['$10,000', 10000],
    ['  $ 40,000  ', 40000],
    ['10k', 10000],
    ['2.5M', 2500000],
    ['1b', 1000000000],
  ])('parses %j as %d', (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected)
  })

  it.each(['', '   ', 'abc', '-5', '1.2.3', '$', '5x', '1e5', 'k', 'NaN', 'Infinity'])(
    'returns null for %j',
    (raw) => {
      expect(parseAmount(raw)).toBeNull()
    },
  )
})
