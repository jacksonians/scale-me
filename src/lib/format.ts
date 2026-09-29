import { parseAmount } from './parse'

const MIN_VISIBLE_PERCENT = 0.0001

const wholeDollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const dollarsAndCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const percent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 2,
})

const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

const ratio = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

const groupedAmount = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function formatCurrency(value: number): string {
  const cents = Math.round(value * 100)
  return cents % 100 === 0 ? wholeDollars.format(value) : dollarsAndCents.format(value)
}

export function formatPercent(value: number): string {
  if (value > 0 && value < MIN_VISIBLE_PERCENT) {
    return '<0.01%'
  }
  return percent.format(value)
}

export function formatContracts(count: number): string {
  return `${integer.format(count)} ${count === 1 ? 'contract' : 'contracts'}`
}

// scaleRatio is refPortfolio / myPortfolio; always put the smaller side as 1
export function formatScaleRatio(scaleRatio: number): string {
  return scaleRatio >= 1 ? `1 : ${ratio.format(scaleRatio)}` : `${ratio.format(1 / scaleRatio)} : 1`
}

// Applied when a field loses focus, so "10m" visibly becomes "10,000,000"
export function formatAmountInput(raw: string): string {
  const value = parseAmount(raw)
  return value === null ? raw : groupedAmount.format(value)
}
