import { describe, expect, it } from 'vitest'
import { EMPTY_TRADE, readTradeFromSearch, writeTradeToSearch } from './urlState'

describe('readTradeFromSearch', () => {
  it('reads the reference trade from query params', () => {
    expect(readTradeFromSearch('?c=500&p=2.5&rp=10000000&t=NVDA')).toEqual({
      refContracts: '500',
      premium: '2.5',
      refPortfolio: '10000000',
      ticker: 'NVDA',
    })
  })

  it('returns empty fields when params are missing', () => {
    expect(readTradeFromSearch('')).toEqual(EMPTY_TRADE)
  })

  it('drops values that are not valid amounts', () => {
    expect(readTradeFromSearch('?c=abc&p=-1&rp=10m')).toEqual({
      ...EMPTY_TRADE,
      refPortfolio: '10000000',
    })
  })

  it('sanitizes the ticker', () => {
    expect(readTradeFromSearch('?t=<b>brk.b').ticker).toBe('BBRK.B')
    expect(readTradeFromSearch('?t=ABCDEFGHIJKLMNOP').ticker).toBe('ABCDEFGHIJ')
  })

  it('ignores a portfolio value if someone adds one', () => {
    expect(readTradeFromSearch('?mp=50000')).toEqual(EMPTY_TRADE)
  })
})

describe('writeTradeToSearch', () => {
  it('normalizes amounts and omits empty fields', () => {
    expect(
      writeTradeToSearch({ refContracts: '500', premium: '$2.50', refPortfolio: '10M', ticker: 'nvda' }),
    ).toBe('?c=500&p=2.5&rp=10000000&t=NVDA')
  })

  it('omits invalid values', () => {
    expect(writeTradeToSearch({ ...EMPTY_TRADE, refContracts: 'abc', premium: '1.1' })).toBe('?p=1.1')
  })

  it('returns an empty string when there is nothing to share', () => {
    expect(writeTradeToSearch(EMPTY_TRADE)).toBe('')
  })

  it('round-trips through readTradeFromSearch', () => {
    const trade = { refContracts: '250', premium: '0.85', refPortfolio: '4200000', ticker: 'SPY' }
    expect(readTradeFromSearch(writeTradeToSearch(trade))).toEqual(trade)
  })
})
