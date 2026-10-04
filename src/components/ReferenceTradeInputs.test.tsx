import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MyPortfolioInput } from './MyPortfolioInput'
import { ReferenceTradeInputs } from './ReferenceTradeInputs'

const emptyTrade = { ticker: '', refContracts: '', premium: '', refPortfolio: '' }

describe('input groups', () => {
  it('groups the reference fields as their trade', () => {
    render(<ReferenceTradeInputs trade={emptyTrade} onChange={vi.fn()} errors={{}} summary={null} />)

    expect(screen.getByRole('region', { name: 'Their trade' })).toContainElement(screen.getByLabelText('Contracts'))
  })

  it('shows no summary line until the position cost is known', () => {
    render(<ReferenceTradeInputs trade={emptyTrade} onChange={vi.fn()} errors={{}} summary={null} />)

    expect(screen.queryByText(/position cost/i)).not.toBeInTheDocument()
  })

  it('shows the summary under their trade once known', () => {
    render(
      <ReferenceTradeInputs
        trade={emptyTrade}
        onChange={vi.fn()}
        errors={{}}
        summary="Position cost $125,000, 1.25% of their portfolio."
      />,
    )

    expect(screen.getByRole('region', { name: 'Their trade' })).toHaveTextContent('Position cost $125,000')
  })

  it('groups my portfolio under you, with its privacy hint', () => {
    render(<MyPortfolioInput value="" onChange={vi.fn()} />)

    const field = screen.getByLabelText('Your portfolio')
    expect(screen.getByRole('region', { name: 'You' })).toContainElement(field)
    expect(field).toHaveAccessibleDescription('Saved on this device. Never included in share links.')
  })

  it('replaces the hint with the error and marks the field invalid', () => {
    render(<MyPortfolioInput value="abc" onChange={vi.fn()} error="Enter an amount, like 40,000 or 10M." />)

    const field = screen.getByLabelText('Your portfolio')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription('Enter an amount, like 40,000 or 10M.')
  })
})
