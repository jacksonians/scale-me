import { useRef } from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computeSizing, type SizingResult } from '../lib/sizing'
import { PinnedAnswer } from './PinnedAnswer'

class FakeObserver {
  static latest: FakeObserver | null = null
  readonly callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    FakeObserver.latest = this
  }
  observe() {}
  disconnect() {}
}

function setRingsVisible(visible: boolean) {
  const observer = FakeObserver.latest
  if (!observer) {
    throw new Error('No IntersectionObserver was created')
  }
  act(() =>
    observer.callback(
      [{ isIntersecting: visible } as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver,
    ),
  )
}

function Harness({ result }: { result: SizingResult }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <>
      <div ref={ref} />
      <PinnedAnswer result={result} ticker="NVDA" targetRef={ref} />
    </>
  )
}

const sized = computeSizing({ refContracts: 500, premium: 2.5, refPortfolio: 10_000_000, myPortfolio: 40_000 })
const unsized = computeSizing({ refContracts: 500, premium: 2.5, refPortfolio: 10_000_000, myPortfolio: null })

describe('PinnedAnswer', () => {
  beforeEach(() => {
    FakeObserver.latest = null
    vi.stubGlobal('IntersectionObserver', FakeObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stays hidden while the rings are on screen', () => {
    render(<Harness result={sized} />)
    setRingsVisible(true)

    expect(screen.queryByTestId('pinned-answer')).not.toBeInTheDocument()
  })

  it('pins the answer and its cost once the rings scroll away', () => {
    render(<Harness result={sized} />)
    setRingsVisible(false)

    const pinned = screen.getByTestId('pinned-answer')
    expect(pinned).toHaveTextContent(/2\s*NVDA contracts, \$500/)
    expect(pinned).toHaveAttribute('aria-hidden', 'true')
  })

  it('is fixed so appearing never shifts the page', () => {
    render(<Harness result={sized} />)
    setRingsVisible(false)

    expect(screen.getByTestId('pinned-answer')).toHaveClass('fixed')
  })

  it('shows nothing when there is no answer yet', () => {
    render(<Harness result={unsized} />)
    setRingsVisible(false)

    expect(screen.queryByTestId('pinned-answer')).not.toBeInTheDocument()
  })

  it('does nothing in browsers without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    render(<Harness result={sized} />)

    expect(screen.queryByTestId('pinned-answer')).not.toBeInTheDocument()
  })
})
