import { buildRows, type Cell, type OcrWord, type Row } from './layout'

export type PremiumSource = 'fill' | 'average-cost' | 'derived-from-total' | 'limit'

export interface ExtractedTrade {
  ticker?: string
  strike?: number
  optionType?: 'Call' | 'Put'
  expiry?: string
  side?: 'buy' | 'sell'
  contracts?: number
  premium?: number
  premiumSource?: PremiumSource
}

const SHARES_PER_CONTRACT = 100

// OCR sometimes reads "$" as "S"; accept either but insist on a currency mark
// so a stray number elsewhere on screen is never taken for a price.
const DOLLAR = '[$S]\\s?'
const WHOLE = '(\\d{1,3}(?:,\\d{3})+|\\d+)'

// Robinhood always prints option prices with cents. Requiring them means a
// misread like "$415" (for $4.15) is rejected instead of silently used.
const MONEY_PATTERN = new RegExp(`^\\+?\\s*${DOLLAR}${WHOLE}\\.(\\d{2})(?!\\d)`)
const COUNT_PATTERN = new RegExp(`^([+-])?\\s*${WHOLE}(?:\\s+contracts?)?$`, 'i')
const FILL_PATTERN = new RegExp(`${WHOLE}\\s+contracts?\\s+at\\s+${DOLLAR}${WHOLE}\\.(\\d{2,})`, 'i')
const DATE_PATTERN = /^\d{1,2}\/\d{1,2}(?:\/\d{2,4})?$/

// "Buy AVGO $420 Call 10/30", "Your limit order for CRWV $90 Call 10/23 filled."
const OPTION_PATTERN = new RegExp(
  `(?:\\b(Buy|Sell)\\s+)?\\b([A-Z]{1,5}(?:\\.[A-Z])?)\\s+${DOLLAR}(\\d[\\d,]*(?:\\.\\d+)?)\\s+(Call|Put)\\b(?:\\s+(\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?))?`,
)
// "CRWV Long Call filled"
const TITLE_PATTERN = /\b([A-Z]{1,5}(?:\.[A-Z])?)\s+(Long|Short)\s+(Call|Put)\b/

const CONTRACT_LABELS = ['Contracts purchased', 'Filled quantity', 'Quantity', 'Contracts', 'New position']
const AVERAGE_LABELS = ['Average cost', 'Average price', 'Avg cost', 'Avg price']
const TOTAL_LABELS = ['Est total cost', 'Total cost', 'Est cost']
const LIMIT_LABELS = ['Limit price']
const EXPIRY_LABELS = ['Expiration date', 'Expiration']

const toNumber = (whole: string, fraction = '') => Number(`${whole.replace(/,/g, '')}${fraction ? `.${fraction}` : ''}`)
const roundToCents = (value: number) => Math.round(value * 100) / 100

function parseMoney(text: string): number | undefined {
  const match = MONEY_PATTERN.exec(text.trim())
  return match ? toNumber(match[1] ?? '', match[2]) : undefined
}

function parseCount(text: string): { count: number; sign?: string } | undefined {
  const match = COUNT_PATTERN.exec(text.trim())
  const count = match ? toNumber(match[2] ?? '') : 0
  return match && count > 0 ? { count, sign: match[1] } : undefined
}

function parseDate(text: string): string | undefined {
  return DATE_PATTERN.test(text.trim()) ? text.trim() : undefined
}

function parsePositionEffect(text: string): 'open' | 'close' | undefined {
  if (/^close/i.test(text.trim())) {
    return 'close'
  }
  return /^open/i.test(text.trim()) ? 'open' : undefined
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Tolerates OCR dropping spaces ("Estcost") or adding punctuation ("Limit price.")
function labelPattern(label: string): RegExp {
  return new RegExp(`^${label.split(' ').map(escapeRegExp).join('\\s*')}[\\s.:]*(.*)$`, 'i')
}

const overlapsHorizontally = (a: Cell, b: Cell) => a.x0 < b.x1 && a.x1 > b.x0

// Robinhood puts a value either to the right of its label (sheets, position
// cards) or directly beneath it (order detail grid). Labels are tried in
// priority order; a label cell with unparseable trailing text ("Contracts
// purchased" when looking for "Contracts") is a different label and is skipped.
function findValue<T>(rows: Row[], labels: string[], parse: (text: string) => T | undefined): T | undefined {
  for (const label of labels) {
    const pattern = labelPattern(label)
    for (const [rowIndex, row] of rows.entries()) {
      for (const [cellIndex, cell] of row.cells.entries()) {
        const match = pattern.exec(cell.text.trim())
        if (!match) {
          continue
        }
        const remainder = (match[1] ?? '').trim()
        if (remainder) {
          const merged = parse(remainder)
          if (merged !== undefined) {
            return merged
          }
          continue
        }
        const right = row.cells[cellIndex + 1]
        const rightValue = right ? parse(right.text) : undefined
        if (rightValue !== undefined) {
          return rightValue
        }
        const below = rows[rowIndex + 1]?.cells.find((candidate) => overlapsHorizontally(candidate, cell))
        const belowValue = below ? parse(below.text) : undefined
        if (belowValue !== undefined) {
          return belowValue
        }
      }
    }
  }
  return undefined
}

function firstMatch(cells: Cell[], pattern: RegExp): RegExpExecArray | undefined {
  for (const cell of cells) {
    const match = pattern.exec(cell.text)
    if (match) {
      return match
    }
  }
  return undefined
}

export function extractTrade(words: OcrWord[]): ExtractedTrade {
  const rows = buildRows(words)
  const cells = rows.flatMap((row) => row.cells)
  const trade: ExtractedTrade = {}

  const option = firstMatch(cells, OPTION_PATTERN)
  const title = firstMatch(cells, TITLE_PATTERN)
  if (option) {
    trade.ticker = option[2]
    trade.strike = Number((option[3] ?? '').replace(/,/g, ''))
    trade.optionType = option[4] as 'Call' | 'Put'
    if (option[5]) {
      trade.expiry = option[5]
    }
  } else if (title) {
    trade.ticker = title[1]
    trade.optionType = title[3] as 'Call' | 'Put'
  }
  const expiry = trade.expiry ?? findValue(rows, EXPIRY_LABELS, parseDate)
  if (expiry) {
    trade.expiry = expiry
  }

  const fill = firstMatch(cells, FILL_PATTERN)
  const counted = fill ? undefined : findValue(rows, CONTRACT_LABELS, parseCount)
  const contracts = fill ? toNumber(fill[1] ?? '') : counted?.count
  if (contracts) {
    trade.contracts = contracts
  }

  const positionEffect = findValue(rows, ['Position effect'], parsePositionEffect)
  const sells = option?.[1] === 'Sell' || title?.[2] === 'Short' || positionEffect === 'close' || counted?.sign === '-'
  const buys = option?.[1] === 'Buy' || title?.[2] === 'Long' || counted?.sign === '+'
  if (sells) {
    trade.side = 'sell'
  } else if (buys) {
    trade.side = 'buy'
  }

  const premium = pickPremium(rows, fill, contracts)
  if (premium) {
    trade.premium = premium.value
    trade.premiumSource = premium.source
  }
  return trade
}

// Prefer what was actually paid per share: the fill line, then the position's
// average cost, then the total cost spread over the contracts (Robinhood's
// "order filled" sheet shows the limit price, which can be above the fill).
function pickPremium(
  rows: Row[],
  fill: RegExpExecArray | undefined,
  contracts: number | undefined,
): { value: number; source: PremiumSource } | undefined {
  if (fill) {
    return { value: toNumber(fill[2] ?? '', fill[3]), source: 'fill' }
  }
  const average = findValue(rows, AVERAGE_LABELS, parseMoney)
  if (average) {
    return { value: average, source: 'average-cost' }
  }
  const total = contracts ? findValue(rows, TOTAL_LABELS, parseMoney) : undefined
  if (total && contracts) {
    return { value: roundToCents(total / (contracts * SHARES_PER_CONTRACT)), source: 'derived-from-total' }
  }
  const limit = findValue(rows, LIMIT_LABELS, parseMoney)
  return limit ? { value: limit, source: 'limit' } : undefined
}

const PREMIUM_NOTES: Partial<Record<PremiumSource, string>> = {
  'derived-from-total': 'Premium is the average fill, worked out from the total cost.',
  limit: 'Premium is the limit price. The fill may have been lower.',
}

const countFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export interface ExtractionDescription {
  foundAnything: boolean
  summary: string
  notes: string[]
}

export function describeExtraction(trade: ExtractedTrade): ExtractionDescription {
  const option = [trade.ticker, trade.strike === undefined ? undefined : `$${trade.strike}`, trade.optionType, trade.expiry]
    .filter(Boolean)
    .join(' ')
  const parts = [
    option,
    trade.contracts === undefined
      ? ''
      : `${countFormat.format(trade.contracts)} ${trade.contracts === 1 ? 'contract' : 'contracts'}`,
    trade.premium === undefined ? '' : `$${trade.premium.toFixed(2)} per share`,
  ].filter(Boolean)

  const notes: string[] = []
  if (trade.side === 'sell') {
    notes.push('This looks like a sell or closing order. scale-me sizes long buys.')
  }
  const premiumNote = trade.premiumSource ? PREMIUM_NOTES[trade.premiumSource] : undefined
  if (premiumNote) {
    notes.push(premiumNote)
  }
  if (trade.contracts === undefined && trade.premium === undefined) {
    notes.push("Couldn't find the contracts or premium. Enter them below.")
  } else if (trade.contracts === undefined) {
    notes.push("Couldn't find the number of contracts. Enter it below.")
  } else if (trade.premium === undefined) {
    notes.push("Couldn't find the premium. Enter it below.")
  }

  return {
    foundAnything: trade.ticker !== undefined || trade.contracts !== undefined || trade.premium !== undefined,
    summary: parts.join(' · '),
    notes,
  }
}
