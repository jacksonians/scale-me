import { AmountField } from './AmountField'

interface MyPortfolioInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function MyPortfolioInput({ value, onChange, error }: MyPortfolioInputProps) {
  return (
    <div className="rounded-lg border border-rule bg-sheet px-4 py-4 sm:px-5">
      <AmountField
        label="Your portfolio"
        value={value}
        onChange={onChange}
        placeholder="40,000"
        prefix="$"
        hint="Saved on this device. Never included in share links."
        groupDigitsOnBlur
        error={error}
      />
    </div>
  )
}
