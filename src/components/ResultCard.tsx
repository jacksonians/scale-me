import type { RefObject } from 'react'
import { contractCountFontSize } from '../lib/contractCountFontSize'
import { formatContracts, formatCurrency, formatPercent } from '../lib/format'
import type { SizingResult, SizingWarning } from '../lib/sizing'
import { ScaleJoint } from './ScaleJoint'

interface ResultCardProps {
  result: SizingResult
  ticker: string
  ringsRef: RefObject<HTMLDivElement | null>
}

function warningText(warning: SizingWarning, refPct: number): string {
  switch (warning.kind) {
    case 'too-small':
      return (
        `Your portfolio is too small to match ${formatPercent(refPct)} with one contract. ` +
        `One contract is ${formatPercent(warning.oneContractPct)} of your portfolio. ` +
        `To match with one contract, you'd need a portfolio of ${formatCurrency(warning.minPortfolioForOne)}.`
      )
    case 'reference-over-100':
      return (
        `This position costs ${formatPercent(warning.refPct)} of their portfolio, which usually means a typo. ` +
        `Check the contracts, premium, and portfolio size.`
      )
  }
}

export function ResultCard({ result, ticker, ringsRef }: ResultCardProps) {
  const count = result.ok ? result.recommended.toLocaleString('en-US') : null

  return (
    <section aria-labelledby="your-trade-heading" className="flex flex-col gap-3">
      <h2 id="your-trade-heading" className="sr-only">
        Your trade
      </h2>
      <div ref={ringsRef} className="rings mx-auto flex size-[190px] items-center justify-center rounded-full">
        <div className="flex size-[128px] flex-col items-center justify-center rounded-full border-[1.5px] border-ink bg-ground">
          {result.ok && count !== null ? (
            <span
              data-testid="recommended-contracts"
              style={{ fontSize: `${contractCountFontSize(count)}px` }}
              className={`tnum font-sans leading-[0.8] font-extralight ${
                result.recommended > 0 ? 'text-accent' : 'text-muted'
              }`}
            >
              {count}
            </span>
          ) : (
            <span aria-hidden="true" className="text-[56px] leading-[0.8] font-extralight text-ink/30">
              –
            </span>
          )}
          <span aria-hidden={!result.ok} className="mt-1.5 text-xs text-muted">
            {result.ok && result.recommended === 1 ? 'contract' : 'contracts'}
          </span>
        </div>
      </div>
      <ScaleJoint scaleRatio={result.ok ? result.scaleRatio : null} />
      {!result.ok ? (
        <p className="sr-only">Fill in the reference trade and your portfolio to see how many contracts to buy.</p>
      ) : (
        <>
          <div className="tnum flex flex-col text-sm leading-normal text-muted">
            {result.recommended > 0 ? (
              <>
                <p>
                  Buy{' '}
                  <b className="font-semibold text-ink">
                    {ticker ? `${count} ${ticker}` : formatContracts(result.recommended)}
                  </b>{' '}
                  at {formatCurrency(result.premium)} per share
                </p>
                <p>
                  <b className="font-semibold text-ink">{formatCurrency(result.myCost)}</b>, the most you can lose
                </p>
                <p>
                  {formatPercent(result.myPct)} of your portfolio, theirs was {formatPercent(result.refPct)}
                </p>
              </>
            ) : (
              <p>At the same share of your portfolio</p>
            )}
          </div>
          {result.roundedUp && result.recommended > 0 && (
            <p className="tnum text-[12.5px] text-muted">
              Rounding up to {formatContracts(result.roundedUp.contracts)} would cost{' '}
              {formatCurrency(result.roundedUp.cost)}, {formatPercent(result.roundedUp.pct)} of your portfolio.
            </p>
          )}
          {result.warnings.length > 0 && (
            <div role="status" className="flex flex-col gap-2">
              {result.warnings.map((warning) => (
                <p
                  key={warning.kind}
                  className="tnum border-l-[3px] border-caution py-1.5 pl-2.5 text-[12.5px] leading-normal text-ink"
                >
                  {warningText(warning, result.refPct)}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
