export const CONTRACT_MULTIPLIER = 100

// Tolerance for float drift when a result should land exactly on a whole contract
const EPSILON = 1e-9

export interface SizingInput {
  refContracts: number | null
  premium: number | null
  refPortfolio: number | null
  myPortfolio: number | null
}

export type SizingField = keyof SizingInput

export type SizingError = 'missing' | 'not-positive' | 'not-whole'

export type SizingWarning =
  | { kind: 'too-small'; oneContractPct: number; minPortfolioForOne: number }
  | { kind: 'reference-over-100'; refPct: number }

export interface RoundedUpOption {
  contracts: number
  cost: number
  pct: number
}

export interface SizingSuccess {
  ok: true
  premium: number
  contractCost: number
  refCost: number
  refPct: number
  exactContracts: number
  recommended: number
  myCost: number
  maxLoss: number
  myPct: number
  roundedUp: RoundedUpOption | null
  scaleRatio: number
  minPortfolioForOne: number
  warnings: SizingWarning[]
}

export interface SizingFailure {
  ok: false
  errors: Partial<Record<SizingField, SizingError>>
}

export type SizingResult = SizingSuccess | SizingFailure

const SIZING_FIELDS: SizingField[] = ['refContracts', 'premium', 'refPortfolio', 'myPortfolio']

export function floorSafe(value: number): number {
  return Math.floor(value + EPSILON)
}

export function ceilSafe(value: number): number {
  return Math.ceil(value - EPSILON)
}

function validate(input: SizingInput): SizingFailure['errors'] {
  const errors: SizingFailure['errors'] = {}
  for (const field of SIZING_FIELDS) {
    const value = input[field]
    if (value === null) {
      errors[field] = 'missing'
    } else if (!(value > 0)) {
      errors[field] = 'not-positive'
    } else if (field === 'refContracts' && !Number.isInteger(value)) {
      errors[field] = 'not-whole'
    }
  }
  return errors
}

export function computeSizing(input: SizingInput): SizingResult {
  const errors = validate(input)
  const { refContracts, premium, refPortfolio, myPortfolio } = input
  if (
    SIZING_FIELDS.some((field) => errors[field] !== undefined) ||
    refContracts === null ||
    premium === null ||
    refPortfolio === null ||
    myPortfolio === null
  ) {
    return { ok: false, errors }
  }

  const contractCost = premium * CONTRACT_MULTIPLIER
  const refCost = refContracts * contractCost
  const refPct = refCost / refPortfolio
  // Premium cancels out of the contract count; keeping it out avoids extra float drift
  const exactContracts = (refContracts * myPortfolio) / refPortfolio
  const recommended = floorSafe(exactContracts)
  const myCost = recommended * contractCost
  const minPortfolioForOne = refPortfolio / refContracts

  const roundedUpContracts = ceilSafe(exactContracts)
  const roundedUp =
    roundedUpContracts > recommended
      ? {
          contracts: roundedUpContracts,
          cost: roundedUpContracts * contractCost,
          pct: (roundedUpContracts * contractCost) / myPortfolio,
        }
      : null

  const warnings: SizingWarning[] = []
  if (recommended === 0) {
    warnings.push({ kind: 'too-small', oneContractPct: contractCost / myPortfolio, minPortfolioForOne })
  }
  if (refPct > 1) {
    warnings.push({ kind: 'reference-over-100', refPct })
  }

  return {
    ok: true,
    premium,
    contractCost,
    refCost,
    refPct,
    exactContracts,
    recommended,
    myCost,
    maxLoss: myCost,
    myPct: myCost / myPortfolio,
    roundedUp,
    scaleRatio: refPortfolio / myPortfolio,
    minPortfolioForOne,
    warnings,
  }
}
