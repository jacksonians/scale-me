import { createRef } from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { computeSizing } from '../lib/sizing'
import { ResultCard } from './ResultCard'

const trade = { refContracts: 500, premium: 2.5, refPortfolio: 10_000_000 }

function renderResult(myPortfolio: number | null, ticker = 'NVDA') {
  render(<ResultCard result={computeSizing({ ...trade, myPortfolio })} ticker={ticker} ringsRef={createRef()} />)
  return within(screen.getByRole('region', { name: 'Your trade' }))
}

describe('ResultCard', () => {
  it('keeps the guidance for screen readers but shows only a dash before input', () => {
    const region = renderResult(null)

    expect(region.getByText(/fill in the reference trade/i)).toHaveClass('sr-only')
    expect(region.queryByTestId('recommended-contracts')).not.toBeInTheDocument()
    expect(region.getByText('Scaled to your portfolio')).toBeInTheDocument()
  })

  it('shows the count in the accent color with cost, max loss and both shares', () => {
    const region = renderResult(40_000)

    const count = region.getByTestId('recommended-contracts')
    expect(count).toHaveTextContent('2')
    expect(count).toHaveClass('text-accent', 'text-[88px]')
    expect(screen.getByRole('region', { name: 'Your trade' })).toHaveTextContent('Buy 2 NVDA at $2.50 per share')
    expect(region.getByText('$500')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Your trade' })).toHaveTextContent(
      '1.25% of your portfolio, theirs was 1.25%',
    )
    expect(region.getByText('1 : 250')).toBeInTheDocument()
  })

  it('names contracts when there is no ticker', () => {
    renderResult(40_000, '')

    expect(screen.getByRole('region', { name: 'Your trade' })).toHaveTextContent('Buy 2 contracts at $2.50 per share')
  })

  it('shows a zero in muted gray with no buy line or cost', () => {
    const region = renderResult(15_000)

    expect(region.getByTestId('recommended-contracts')).toHaveClass('text-muted')
    expect(screen.getByRole('region', { name: 'Your trade' })).not.toHaveTextContent('Buy')
    expect(screen.getByRole('region', { name: 'Your trade' })).not.toHaveTextContent('the most you can lose')
    expect(region.getByRole('status')).toHaveTextContent('$20,000')
  })
})
