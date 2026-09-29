import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

async function fillReferenceTrade(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Contracts'), '500')
  await user.type(screen.getByLabelText('Premium per share'), '2.50')
  await user.type(screen.getByLabelText('Their portfolio'), '10,000,000')
}

function yourTrade() {
  return within(screen.getByRole('region', { name: 'Your trade' }))
}

describe('App', () => {
  it('prompts for input before anything is entered', () => {
    render(<App />)
    expect(yourTrade().getByText(/fill in the reference trade/i)).toBeInTheDocument()
  })

  it('sizes the trade to the same share of my portfolio', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillReferenceTrade(user)
    await user.type(screen.getByLabelText('Your portfolio'), '40000')

    expect(screen.getByText(/\$125,000, 1\.25% of their portfolio/)).toBeInTheDocument()
    const result = yourTrade()
    expect(result.getByTestId('recommended-contracts')).toHaveTextContent('2')
    expect(result.getByText('$500')).toBeInTheDocument()
    expect(screen.getByText('1 : 250')).toBeInTheDocument()
  })

  it('offers the round-up alternative for fractional results', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillReferenceTrade(user)
    await user.type(screen.getByLabelText('Your portfolio'), '50000')

    expect(yourTrade().getByTestId('recommended-contracts')).toHaveTextContent('2')
    expect(yourTrade().getByText(/rounding up to 3 contracts would cost \$750, 1\.5%/i)).toBeInTheDocument()
  })

  it('explains when the portfolio is too small for one contract', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillReferenceTrade(user)
    await user.type(screen.getByLabelText('Your portfolio'), '15000')

    expect(yourTrade().getByTestId('recommended-contracts')).toHaveTextContent('0')
    expect(yourTrade().queryByText('Buy')).not.toBeInTheDocument()
    const warning = yourTrade().getByRole('status')
    expect(warning).toHaveTextContent('1.67%')
    expect(warning).toHaveTextContent('$20,000')
  })

  it('groups digits when leaving a field so shorthand is confirmed', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Their portfolio'), '10m')
    await user.tab()

    expect(screen.getByLabelText('Their portfolio')).toHaveValue('10,000,000')
  })

  it('shows a field error for fractional contracts', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Contracts'), '2.5')

    expect(screen.getByLabelText('Contracts')).toHaveAccessibleDescription(/whole number/i)
  })

  it('remembers my portfolio across visits', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.type(screen.getByLabelText('Your portfolio'), '40000')
    unmount()

    render(<App />)
    expect(screen.getByLabelText('Your portfolio')).toHaveValue('40000')
  })

  it('keeps the reference trade in the URL but never my portfolio', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Ticker (optional)'), 'nvda')
    await fillReferenceTrade(user)
    await user.type(screen.getByLabelText('Your portfolio'), '40000')

    expect(window.location.search).toBe('?c=500&p=2.5&rp=10000000&t=NVDA')
  })

  it('prefills the reference trade from a shared link', () => {
    window.history.replaceState(null, '', '/?c=500&p=2.5&rp=10000000&t=NVDA')
    render(<App />)

    expect(screen.getByLabelText('Contracts')).toHaveValue('500')
    expect(screen.getByLabelText('Premium per share')).toHaveValue('2.5')
    expect(screen.getByLabelText('Their portfolio')).toHaveValue('10,000,000')
    expect(screen.getByLabelText('Ticker (optional)')).toHaveValue('NVDA')
  })

  it('copies a share link', async () => {
    const user = userEvent.setup()
    render(<App />)
    await fillReferenceTrade(user)

    await user.click(screen.getByRole('button', { name: 'Copy link to this trade' }))

    expect(await navigator.clipboard.readText()).toBe(window.location.href)
    expect(screen.getByText('Link copied')).toBeInTheDocument()
  })
})
