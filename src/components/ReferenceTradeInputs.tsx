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
    <section aria-labelledby="reference-heading" className="flex flex-col gap-1">
      <h2 id="reference-heading" className="text-[13px] font-semibold">
        Their trade
      </h2>
      <AmountField
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
      {summary && <p className="tnum mt-1.5 text-xs text-muted">{summary}</p>}
    </section>
  )
}
