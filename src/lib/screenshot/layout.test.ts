import { describe, expect, it } from 'vitest'
import { buildRows, wordsFromBlocks, type OcrWord } from './layout'

function word(text: string, x0: number, y0: number, x1: number, y1: number): OcrWord {
  return { text, bbox: { x0, y0, x1, y1 } }
}

function cellTexts(words: OcrWord[]): string[][] {
  return buildRows(words).map((row) => row.cells.map((cell) => cell.text))
}

describe('buildRows', () => {
  it('groups words on the same line despite descenders and jitter', () => {
    const words = [
      word('CRWV', 87, 116, 202, 148),
      word('Long', 213, 116, 303, 158),
      word('Call', 314, 118, 382, 148),
      word('Your', 90, 249, 156, 273),
      word('limit', 168, 246, 233, 273),
    ]
    expect(cellTexts(words)).toEqual([['CRWV Long Call'], ['Your limit']])
  })

  it('splits a row into cells at wide gaps so labels and values separate', () => {
    const words = [
      word('Contracts', 88, 500, 244, 529),
      word('purchased', 254, 501, 423, 537),
      word('50', 807, 500, 847, 529),
    ]
    expect(cellTexts(words)).toEqual([['Contracts purchased', '50']])
  })

  it('keeps two side-by-side cards as separate cells in one row', () => {
    const words = [
      word('Current', 132, 1336, 211, 1355),
      word('price', 218, 1336, 272, 1360),
      word('$17.43', 890, 1332, 958, 1365),
      word('Average', 1075, 1337, 1161, 1360),
      word('cost', 1168, 1338, 1214, 1354),
      word('$17.30', 1832, 1336, 1902, 1356),
    ]
    expect(cellTexts(words)).toEqual([['Current price', '$17.43', 'Average cost', '$17.30']])
  })

  it('orders rows top to bottom and cells left to right regardless of input order', () => {
    const words = [
      word('400', 455, 364, 501, 396),
      word('Account', 877, 329, 967, 347),
      word('Quantity', 455, 324, 557, 356),
    ]
    const rows = buildRows(words)
    expect(rows.map((row) => row.cells.map((cell) => cell.text))).toEqual([['Quantity', 'Account'], ['400']])
    expect(rows[1]?.cells[0]).toMatchObject({ x0: 455, x1: 501 })
  })

  it('ignores empty words', () => {
    expect(cellTexts([word('  ', 0, 0, 10, 10)])).toEqual([])
  })
})

describe('wordsFromBlocks', () => {
  it('flattens Tesseract blocks into words', () => {
    const bbox = { x0: 1, y0: 2, x1: 3, y1: 4 }
    const blocks = [{ paragraphs: [{ lines: [{ words: [{ text: 'Buy', bbox }, { text: 'AVGO', bbox }] }] }] }]
    expect(wordsFromBlocks(blocks).map((w) => w.text)).toEqual(['Buy', 'AVGO'])
  })

  it('treats missing blocks as no words', () => {
    expect(wordsFromBlocks(null)).toEqual([])
  })
})
