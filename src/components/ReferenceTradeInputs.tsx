import type { ReferenceTradeFields } from '../lib/urlState'
import { AmountField } from './AmountField'

interface ReferenceTradeInputsProps {
  trade: ReferenceTradeFields
  onChange: (field: keyof ReferenceTradeFields, value: string) => void
  errors: Partial<Record<keyof ReferenceTradeFields, string>>
  summary: string | null
}

export function ReferenceTradeInputs({ trade, onChange, errors, summary }: ReferenceTradeInputsProps) {
  return (
    <section aria-labelledby="reference-heading" className="rounded-lg border border-rule bg-sheet">
      <div className="px-4 pt-4 pb-5 sm:px-5">
        <h2 id="reference-heading" className="text-lg font-semibold">
          Reference trade
        </h2>
        <p className="mt-0.5 text-sm text-muted">The position you want to copy.</p>

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-[7rem_1fr_1fr]">
          <AmountField
            className="col-span-2 sm:col-span-1"
            label="Ticker (optional)"
            value={trade.ticker}
            onChange={(value) => onChange('ticker', value)}
            placeholder="NVDA"
            inputMode="text"
          />
          <AmountField
            label="Contracts"
            value={trade.refContracts}
            onChange={(value) => onChange('refContracts', value)}
            placeholder="500"
            inputMode="numeric"
            groupDigitsOnBlur
            error={errors.refContracts}
          />
          <AmountField
            label="Premium per share"
            value={trade.premium}
            onChange={(value) => onChange('premium', value)}
            placeholder="2.50"
            prefix="$"
            error={errors.premium}
          />
          <AmountField
            className="col-span-2 sm:col-span-3"
            label="Their portfolio"
            value={trade.refPortfolio}
            onChange={(value) => onChange('refPortfolio', value)}
            placeholder="10,000,000"
            prefix="$"
            inputMode="text"
            hint="Total account size. 10M and 250k work too."
            groupDigitsOnBlur
            error={errors.refPortfolio}
          />
        </div>
      </div>

      <p className="min-h-12 border-t border-dashed border-rule px-4 py-3 text-sm text-muted sm:px-5">
        {summary ?? 'Position cost and share of portfolio appear here.'}
      </p>
    </section>
  )
}
