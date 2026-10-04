import { formatContracts, formatCurrency, formatPercent } from '../lib/format'
import type { SizingResult, SizingWarning } from '../lib/sizing'

interface ResultCardProps {
  result: SizingResult
  ticker: string
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

export function ResultCard({ result, ticker }: ResultCardProps) {
  return (
    <section
      aria-labelledby="your-trade-heading"
      className="rounded-lg bg-carbon px-4 py-5 text-carbon-ink shadow-[0_1px_0_rgb(0_0_0/0.15)] sm:px-5"
    >
      <h2 id="your-trade-heading" className="text-lg font-semibold">
        Your trade
      </h2>

      {!result.ok ? (
        <p className="mt-2 max-w-sm text-carbon-soft">
          Fill in the reference trade and your portfolio to see how many contracts to buy.
        </p>
      ) : (
        <>
          <p className="mt-4 text-carbon-soft">
            {result.recommended > 0 ? 'Buy' : 'At the same share of your portfolio'}
          </p>
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span
              data-testid="recommended-contracts"
              className="tnum text-[clamp(5rem,26vw,8rem)] leading-[0.85] font-bold tracking-tight"
            >
              {result.recommended.toLocaleString('en-US')}
            </span>
            <span className="text-xl font-medium">
              {ticker ? `${ticker} ` : ''}
              {result.recommended === 1 ? 'contract' : 'contracts'}
            </span>
          </p>
          <p className="mt-2 text-carbon-soft">at {formatCurrency(result.premium)} premium per share</p>

          <dl className="mt-5 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-t border-white/20 pt-4">
            <dt className="text-carbon-soft">Cost, and the most you can lose</dt>
            <dd className="tnum text-right text-lg font-semibold">{formatCurrency(result.myCost)}</dd>
            <dt className="text-carbon-soft">Share of your portfolio</dt>
            <dd className="tnum text-right text-lg font-semibold">{formatPercent(result.myPct)}</dd>
            <dt className="text-carbon-soft">Share of theirs</dt>
            <dd className="tnum text-right text-lg font-semibold">{formatPercent(result.refPct)}</dd>
          </dl>

          {result.roundedUp && result.recommended > 0 && (
            <p className="mt-4 text-sm text-carbon-soft">
              Rounding up to {formatContracts(result.roundedUp.contracts)} would cost{' '}
              {formatCurrency(result.roundedUp.cost)}, {formatPercent(result.roundedUp.pct)} of your portfolio.
            </p>
          )}

          {result.warnings.length > 0 && (
            <div role="status" className="mt-4 flex flex-col gap-2">
              {result.warnings.map((warning) => (
                <p
                  key={warning.kind}
                  className="rounded-md border-l-4 border-caution bg-caution-bg px-3 py-2 text-sm text-ink"
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
