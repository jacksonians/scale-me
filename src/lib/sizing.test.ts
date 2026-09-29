import { describe, expect, it } from 'vitest'
import { ceilSafe, computeSizing, floorSafe, type SizingInput } from './sizing'

const baseInput: SizingInput = {
  refContracts: 500,
  premium: 2.5,
  refPortfolio: 10_000_000,
  myPortfolio: 40_000,
}

function expectOk(input: SizingInput) {
  const result = computeSizing(input)
  if (!result.ok) {
    throw new Error(`expected ok result, got errors: ${JSON.stringify(result.errors)}`)
  }
  return result
}

describe('computeSizing', () => {
  it('mirrors the reference trade allocation when it divides evenly', () => {
    const result = expectOk(baseInput)

    expect(result.contractCost).toBe(250)
    expect(result.refCost).toBe(125_000)
    expect(result.refPct).toBeCloseTo(0.0125)
    expect(result.exactContracts).toBe(2)
    expect(result.recommended).toBe(2)
    expect(result.myCost).toBe(500)
    expect(result.maxLoss).toBe(500)
    expect(result.myPct).toBeCloseTo(0.0125)
    expect(result.scaleRatio).toBe(250)
    expect(result.minPortfolioForOne).toBe(20_000)
    expect(result.roundedUp).toBeNull()
    expect(result.warnings).toEqual([])
  })

  it('rounds down and offers a round-up alternative for fractional results', () => {
    const result = expectOk({ ...baseInput, myPortfolio: 50_000 })

    expect(result.exactContracts).toBe(2.5)
    expect(result.recommended).toBe(2)
    expect(result.myCost).toBe(500)
    expect(result.myPct).toBeCloseTo(0.01)
    expect(result.roundedUp).toEqual({ contracts: 3, cost: 750, pct: 0.015 })
  })

  it('warns when the portfolio is too small for even one contract at the same %', () => {
    const result = expectOk({ ...baseInput, myPortfolio: 15_000 })

    expect(result.exactContracts).toBe(0.75)
    expect(result.recommended).toBe(0)
    expect(result.myCost).toBe(0)
    expect(result.myPct).toBe(0)
    expect(result.roundedUp?.contracts).toBe(1)
    expect(result.roundedUp?.cost).toBe(250)
    expect(result.roundedUp?.pct).toBeCloseTo(250 / 15_000)
    expect(result.warnings).toHaveLength(1)
    const [warning] = result.warnings
    expect(warning?.kind).toBe('too-small')
    if (warning?.kind === 'too-small') {
      expect(warning.oneContractPct).toBeCloseTo(250 / 15_000)
      expect(warning.minPortfolioForOne).toBe(20_000)
    }
  })

  it('does not lose a contract to floating-point drift', () => {
    // Computing via refPct and contractCost gives 2.9999999999999996 here
    const result = expectOk({
      refContracts: 30,
      premium: 0.1,
      refPortfolio: 1_000_000,
      myPortfolio: 100_000,
    })

    expect(result.recommended).toBe(3)
    expect(result.roundedUp).toBeNull()
  })

  it('scales up when my portfolio is larger than the reference portfolio', () => {
    const result = expectOk({ ...baseInput, refPortfolio: 1_000_000, myPortfolio: 2_000_000 })

    expect(result.recommended).toBe(1000)
    expect(result.scaleRatio).toBe(0.5)
  })

  it('warns when the reference trade costs more than the reference portfolio', () => {
    const result = expectOk({ ...baseInput, refPortfolio: 100_000 })

    expect(result.refPct).toBeCloseTo(1.25)
    expect(result.warnings).toContainEqual({ kind: 'reference-over-100', refPct: 1.25 })
  })

  it('reports missing inputs', () => {
    const result = computeSizing({ refContracts: null, premium: null, refPortfolio: null, myPortfolio: null })

    expect(result).toEqual({
      ok: false,
      errors: {
        refContracts: 'missing',
        premium: 'missing',
        refPortfolio: 'missing',
        myPortfolio: 'missing',
      },
    })
  })

  it('rejects zero and fractional contract counts', () => {
    expect(computeSizing({ ...baseInput, refContracts: 0, premium: 0 })).toEqual({
      ok: false,
      errors: { refContracts: 'not-positive', premium: 'not-positive' },
    })
    expect(computeSizing({ ...baseInput, refContracts: 2.5 })).toEqual({
      ok: false,
      errors: { refContracts: 'not-whole' },
    })
  })

  it('rejects zero portfolios', () => {
    expect(computeSizing({ ...baseInput, refPortfolio: 0, myPortfolio: 0 })).toEqual({
      ok: false,
      errors: { refPortfolio: 'not-positive', myPortfolio: 'not-positive' },
    })
  })
})

describe('floorSafe / ceilSafe', () => {
  it('treats values within tolerance of an integer as that integer', () => {
    expect(floorSafe(2.9999999999999996)).toBe(3)
    expect(ceilSafe(3.0000000000000004)).toBe(3)
  })

  it('rounds normally outside the tolerance', () => {
    expect(floorSafe(2.99)).toBe(2)
    expect(ceilSafe(2.01)).toBe(3)
    expect(floorSafe(0.75)).toBe(0)
    expect(ceilSafe(0.75)).toBe(1)
  })
})
