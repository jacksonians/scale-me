import { describe, expect, it } from 'vitest'
import { describeExtraction, extractTrade } from './extractTrade'
import type { OcrWord } from './layout'

const CHAR_WIDTH = 12
const LINE_HEIGHT = 30
const ROW_SPACING = 70

// Lay out OCR words the way Robinhood renders them: each row is a list of
// [text, x] cells; words inside a cell sit a normal space apart.
function screen(rows: [string, number][][]): OcrWord[] {
  return rows.flatMap((cells, rowIndex) => {
    const y0 = rowIndex * ROW_SPACING
    return cells.flatMap(([text, x]) => {
      let cursor = x
      return text.split(' ').map((part) => {
        const x0 = cursor
        cursor += part.length * CHAR_WIDTH + CHAR_WIDTH
        return { text: part, bbox: { x0, y0, x1: x0 + part.length * CHAR_WIDTH, y1: y0 + LINE_HEIGHT } }
      })
    })
  })
}

const orderFilledSheet = screen([
  [['CRWV Long Call filled', 90]],
  [['Your limit order for CRWV $90 Call 10/23 filled.', 90]],
  [['Account', 90], ['Individual', 690]],
  [['Contracts purchased', 90], ['50', 810]],
  [['Est total cost', 90], ['$20,152.00', 660]],
  [['Limit price', 90], ['$4.15', 760]],
  [['Bid — Ask', 90], ['$3.95 — 84.15', 610]],
  [['New position', 90], ['50 Contracts', 640]],
])

const positionPage = screen([
  [['BE $269.28 (-6.73%)', 85]],
  [['BE $280 Call', 85], ['Legend chart 2', 1730]],
  [['-$11.92 (-40.61%) Today', 85]],
  [['Your position', 85]],
  [['Market value', 130], ['Expiration date', 1075]],
  [['$52,290.00', 130], ['10/23', 1075]],
  [['Current price', 130], ['$17.43', 890], ['Average cost', 1075], ['$17.30', 1830]],
  [['Current BE price', 130], ['$269.28', 870], ['BE breakeven price', 1075], ['$297.30', 1815]],
  [["Today's return", 130], ['+$390.00 (+0.75%)', 650], ['Contracts', 1075], ['+30', 1860]],
  [['Total return', 130], ['+$390.00 (+0.75%)', 650], ['Date bought', 1075], ['9/28', 1850]],
])

const orderDetailGrid = screen([
  [['Buy AVGO $420 Call 10/30', 40], ['$51,600.00', 1130]],
  [['Individual - 35s', 40], ['400 contracts at $1.29', 1000]],
  [['Type', 40], ['Position effect', 460], ['Time in force', 880]],
  [['Limit buy', 40], ['Open', 460], ['Good for day', 880]],
  [['Submitted', 40], ['Quantity', 460], ['Account', 880]],
  [['9/28, 7:17 AM PDT', 40], ['400', 460], ['Individual', 880]],
  [['Status', 40], ['Filled quantity', 460], ['Filled', 880]],
  [['Filled', 40], ['400 contracts at $1.29', 460], ['9/28, 7:17 AM PDT', 880]],
  [['Limit price', 40], ['Est cost', 460], ['Est regulatory fees', 880]],
  [['$1.29', 40], ['$51,616.10', 460], ['$16.10', 880]],
])

describe('extractTrade: Robinhood variants', () => {
  it('reads the "order filled" sheet, deriving the premium actually paid from the total', () => {
    expect(extractTrade(orderFilledSheet)).toEqual({
      ticker: 'CRWV',
      strike: 90,
      optionType: 'Call',
      expiry: '10/23',
      side: 'buy',
      contracts: 50,
      premium: 4.03,
      premiumSource: 'derived-from-total',
    })
  })

  it('reads a position page using average cost, not the current price', () => {
    expect(extractTrade(positionPage)).toEqual({
      ticker: 'BE',
      strike: 280,
      optionType: 'Call',
      expiry: '10/23',
      side: 'buy',
      contracts: 30,
      premium: 17.3,
      premiumSource: 'average-cost',
    })
  })

  it('reads the order detail grid from its fill line', () => {
    expect(extractTrade(orderDetailGrid)).toEqual({
      ticker: 'AVGO',
      strike: 420,
      optionType: 'Call',
      expiry: '10/30',
      side: 'buy',
      contracts: 400,
      premium: 1.29,
      premiumSource: 'fill',
    })
  })
})

describe('extractTrade: layout lookups', () => {
  it('reads values below their labels in a grid', () => {
    const trade = extractTrade(
      screen([
        [['Buy AVGO $420 Call 10/30', 40]],
        [['Submitted', 40], ['Quantity', 460], ['Account', 880]],
        [['9/28, 7:17 AM PDT', 40], ['400', 460], ['Individual', 880]],
        [['Limit price', 40], ['Est cost', 460]],
        [['$1.29', 40], ['$51,616.10', 460]],
      ]),
    )
    expect(trade.contracts).toBe(400)
    // Est cost includes regulatory fees, which rounding to cents absorbs
    expect(trade.premium).toBe(1.29)
    expect(trade.premiumSource).toBe('derived-from-total')
  })

  it('falls back to the limit price when there is no fill or total', () => {
    const trade = extractTrade(
      screen([
        [['Contracts purchased', 90], ['5', 800]],
        [['Limit price', 90], ['$2.50', 760]],
      ]),
    )
    expect(trade).toMatchObject({ contracts: 5, premium: 2.5, premiumSource: 'limit' })
  })

  it('does not let "Contracts purchased" satisfy the bare "Contracts" label', () => {
    const trade = extractTrade(screen([[['Contracts purchased', 90], ['12', 800]]]))
    expect(trade.contracts).toBe(12)
  })

  it('reads a value that OCR merged into the label cell', () => {
    const trade = extractTrade(screen([[['Contracts 7', 90]], [['Average cost $3.10', 90]]]))
    expect(trade).toMatchObject({ contracts: 7, premium: 3.1 })
  })
})

describe('extractTrade: OCR tolerance', () => {
  it('accepts "S" misread for "$"', () => {
    const trade = extractTrade(
      screen([
        [['Your limit order for NVDA S140 Call 11/15 filled.', 90]],
        [['Contracts purchased', 90], ['10', 800]],
        [['Est total cost', 90], ['S2,500.00', 660]],
      ]),
    )
    expect(trade).toMatchObject({ ticker: 'NVDA', strike: 140, contracts: 10, premium: 2.5 })
  })

  it('rejects a premium whose decimal point was lost rather than guessing', () => {
    const trade = extractTrade(screen([[['Limit price', 90], ['$415', 760]]]))
    expect(trade.premium).toBeUndefined()
  })

  it('rejects a zero contract count', () => {
    const trade = extractTrade(screen([[['Contracts', 90], ['+0', 800]]]))
    expect(trade.contracts).toBeUndefined()
  })

  it('reads puts and decimal strikes', () => {
    const trade = extractTrade(screen([[['Buy SPY $512.5 Put 10/4', 40]]]))
    expect(trade).toMatchObject({ ticker: 'SPY', strike: 512.5, optionType: 'Put', expiry: '10/4', side: 'buy' })
  })

  it('reads the ticker from the title when the strike line is missing', () => {
    expect(extractTrade(screen([[['CRWV Long Call filled', 90]]]))).toMatchObject({
      ticker: 'CRWV',
      optionType: 'Call',
      side: 'buy',
    })
  })
})

describe('extractTrade: sells', () => {
  it('flags sell orders', () => {
    expect(extractTrade(screen([[['Sell AVGO $420 Call 10/30', 40]]])).side).toBe('sell')
  })

  it('flags short positions', () => {
    expect(extractTrade(screen([[['TSLA Short Put filled', 90]]])).side).toBe('sell')
  })

  it('flags closing orders', () => {
    const trade = extractTrade(
      screen([
        [['Buy AVGO $420 Call 10/30', 40]],
        [['Type', 40], ['Position effect', 460]],
        [['Limit buy', 40], ['Close', 460]],
      ]),
    )
    expect(trade.side).toBe('sell')
  })

  it('returns nothing for an unrelated image', () => {
    expect(extractTrade(screen([[['Hello world', 40]]]))).toEqual({})
  })
})

describe('describeExtraction', () => {
  it('summarises a complete read', () => {
    const result = describeExtraction({
      ticker: 'CRWV',
      strike: 90,
      optionType: 'Call',
      expiry: '10/23',
      side: 'buy',
      contracts: 50,
      premium: 4.03,
      premiumSource: 'derived-from-total',
    })
    expect(result.summary).toBe('CRWV $90 Call 10/23 · 50 contracts · $4.03 per share')
    expect(result.notes).toEqual(['Premium is the average fill, worked out from the total cost.'])
    expect(result.foundAnything).toBe(true)
  })

  it('lists what it could not find', () => {
    const result = describeExtraction({ ticker: 'BE', contracts: 30 })
    expect(result.summary).toBe('BE · 30 contracts')
    expect(result.notes).toEqual(["Couldn't find the premium. Enter it below."])
  })

  it('warns about sells', () => {
    const result = describeExtraction({ ticker: 'AVGO', contracts: 1, premium: 1, side: 'sell' })
    expect(result.notes).toContain('This looks like a sell or closing order. scale-me sizes long buys.')
  })

  it('reports an unreadable screenshot', () => {
    const result = describeExtraction({})
    expect(result.foundAnything).toBe(false)
    expect(result.summary).toBe('')
  })
})
