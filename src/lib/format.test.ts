import { describe, expect, it } from 'vitest'
import { formatAmountInput, formatContracts, formatCurrency, formatPercent, formatScaleRatio } from './format'

describe('formatCurrency', () => {
  it('drops cents for whole dollars and keeps them otherwise', () => {
    expect(formatCurrency(10_000_000)).toBe('$10,000,000')
    expect(formatCurrency(250)).toBe('$250')
    expect(formatCurrency(2.5)).toBe('$2.50')
    expect(formatCurrency(1234.567)).toBe('$1,234.57')
  })
})

describe('formatPercent', () => {
  it('shows up to two decimals', () => {
    expect(formatPercent(0.0125)).toBe('1.25%')
    expect(formatPercent(250 / 15_000)).toBe('1.67%')
    expect(formatPercent(0.01)).toBe('1%')
    expect(formatPercent(1.25)).toBe('125%')
  })

  it('does not round tiny allocations down to zero', () => {
    expect(formatPercent(0.00001)).toBe('<0.01%')
  })
})

describe('formatContracts', () => {
  it('pluralizes and groups digits', () => {
    expect(formatContracts(1)).toBe('1 contract')
    expect(formatContracts(0)).toBe('0 contracts')
    expect(formatContracts(1200)).toBe('1,200 contracts')
  })
})

describe('formatScaleRatio', () => {
  it('shows how many times smaller the user is', () => {
    expect(formatScaleRatio(250)).toBe('1 : 250')
    expect(formatScaleRatio(333.3333)).toBe('1 : 333.3')
  })

  it('flips when the user is larger than the reference', () => {
    expect(formatScaleRatio(0.5)).toBe('2 : 1')
  })

  it('shows 1 : 1 for equal portfolios', () => {
    expect(formatScaleRatio(1)).toBe('1 : 1')
  })
})

describe('formatAmountInput', () => {
  it('groups digits and expands suffixes so the user sees what was understood', () => {
    expect(formatAmountInput('10000000')).toBe('10,000,000')
    expect(formatAmountInput('10m')).toBe('10,000,000')
    expect(formatAmountInput('$40000.5')).toBe('40,000.5')
  })

  it('leaves blank and unparseable input untouched', () => {
    expect(formatAmountInput('')).toBe('')
    expect(formatAmountInput('abc')).toBe('abc')
  })
})
