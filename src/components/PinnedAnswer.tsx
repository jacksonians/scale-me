import { useEffect, useState, type RefObject } from 'react'
import { formatCurrency } from '../lib/format'
import type { SizingResult } from '../lib/sizing'

interface PinnedAnswerProps {
  result: SizingResult
  ticker: string
  targetRef: RefObject<HTMLElement | null>
}

// Keeps the answer in view once the rings scroll away, e.g. while editing the
// inputs with a phone keyboard open. Fixed, not sticky: an in-flow bar would
// push the rings back into view and flicker.
export function PinnedAnswer({ result, ticker, targetRef }: PinnedAnswerProps) {
  const [targetVisible, setTargetVisible] = useState(true)

  useEffect(() => {
    const target = targetRef.current
    if (!target || typeof IntersectionObserver === 'undefined') {
      return
    }
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1]
      if (entry) {
        setTargetVisible(entry.isIntersecting)
      }
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [targetRef])

  if (targetVisible || !result.ok) {
    return null
  }

  const count = result.recommended
  return (
    <div
      data-testid="pinned-answer"
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-10 bg-ground motion-safe:animate-pin-in"
    >
      <div className="mx-auto max-w-[26rem] px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-baseline gap-2 border-b-[1.5px] border-ink pb-2.5">
          <span className={`tnum text-[30px] leading-[0.8] font-extralight ${count > 0 ? 'text-accent' : 'text-muted'}`}>
            {count.toLocaleString('en-US')}
          </span>
          <span className="tnum text-sm">
            {ticker ? `${ticker} ` : ''}
            {count === 1 ? 'contract' : 'contracts'}, {formatCurrency(result.myCost)}
          </span>
        </div>
      </div>
    </div>
  )
}
