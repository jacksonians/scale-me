import { describe, expect, it } from 'vitest'
import { contractCountSize } from './contractCountSize'

describe('contractCountSize', () => {
  it.each([
    ['2', 'text-[88px]'],
    ['12', 'text-[60px]'],
    ['125', 'text-[40px]'],
    ['1,250', 'text-[28px]'],
    ['12,500', 'text-[24px]'],
    ['125,000', 'text-[20px]'],
    ['1,250,000', 'text-[15px]'],
  ])('sizes %s as %s so it fits inside the inner ring', (text, expected) => {
    expect(contractCountSize(text)).toBe(expected)
  })
})
