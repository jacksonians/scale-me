import { parseAmount } from './parse'

export interface ReferenceTradeFields {
  refContracts: string
  premium: string
  refPortfolio: string
  ticker: string
}

export const EMPTY_TRADE: ReferenceTradeFields = {
  refContracts: '',
  premium: '',
  refPortfolio: '',
  ticker: '',
}

const TICKER_MAX_LENGTH = 10

// Short param names keep shared links readable. The user's own portfolio is
// deliberately never part of the URL so links can be shared without leaking it.
const PARAM_NAMES = {
  refContracts: 'c',
  premium: 'p',
  refPortfolio: 'rp',
  ticker: 't',
} as const satisfies Record<keyof ReferenceTradeFields, string>

const AMOUNT_FIELDS = ['refContracts', 'premium', 'refPortfolio'] as const

function normalizeAmount(raw: string): string {
  const value = parseAmount(raw)
  return value === null ? '' : String(value)
}

export function normalizeTicker(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9.]/g, '')
    .slice(0, TICKER_MAX_LENGTH)
}

export function readTradeFromSearch(search: string): ReferenceTradeFields {
  const params = new URLSearchParams(search)
  const trade = { ...EMPTY_TRADE }
  for (const field of AMOUNT_FIELDS) {
    trade[field] = normalizeAmount(params.get(PARAM_NAMES[field]) ?? '')
  }
  trade.ticker = normalizeTicker(params.get(PARAM_NAMES.ticker) ?? '')
  return trade
}

export function writeTradeToSearch(trade: ReferenceTradeFields): string {
  const params = new URLSearchParams()
  for (const field of AMOUNT_FIELDS) {
    const value = normalizeAmount(trade[field])
    if (value) {
      params.set(PARAM_NAMES[field], value)
    }
  }
  const ticker = normalizeTicker(trade.ticker)
  if (ticker) {
    params.set(PARAM_NAMES.ticker, ticker)
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}
