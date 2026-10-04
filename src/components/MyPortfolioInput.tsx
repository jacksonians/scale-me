import { AmountField } from './AmountField'

interface MyPortfolioInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function MyPortfolioInput({ value, onChange, error }: MyPortfolioInputProps) {
  return (
    <section aria-labelledby="you-heading" className="flex flex-col gap-1">
      <h2 id="you-heading" className="text-[13px] font-semibold">
        You
      </h2>
      <AmountField
        label="Your portfolio"
        value={value}
        onChange={onChange}
        placeholder="40,000"
        prefix="$"
        inputMode="text"
        hint="Saved on this device. Never included in share links."
        groupDigitsOnBlur
        error={error}
      />
    </section>
  )
}
