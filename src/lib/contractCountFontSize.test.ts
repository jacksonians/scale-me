import { describe, expect, it } from 'vitest'
import { contractCountFontSize } from './contractCountFontSize'

describe('contractCountFontSize', () => {
  it.each([
    ['2', 88],
    ['12', 88],
    ['125', 64],
    ['1,250', 42],
    ['12,500', 35],
    ['125,000', 29],
    ['1,250,000', 24],
    ['1,000,000,000', 16],
  ])('sizes %s at %ipx so it fits inside the inner ring', (text, expected) => {
    expect(contractCountFontSize(text)).toBe(expected)
  })
})
