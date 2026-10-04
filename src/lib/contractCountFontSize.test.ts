import { describe, expect, it } from 'vitest'
import { contractCountFontSize } from './contractCountFontSize'

describe('contractCountFontSize', () => {
  it.each([
    ['2', 88],
    // Two digits are the most common answer; at 88px the 7's top bar touched the ring
    ['77', 74],
    ['125', 55],
    ['1,250', 39],
    ['12,500', 33],
    ['125,000', 28],
    ['1,250,000', 23],
    ['1,000,000,000', 16],
  ])('sizes %s at %ipx so its top corners stay inside the inner ring', (text, expected) => {
    expect(contractCountFontSize(text)).toBe(expected)
  })
})
