import { useId } from 'react'
import { formatAmountInput } from '../lib/format'

interface AmountFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  prefix?: string
  hint?: string
  error?: string
  inputMode?: 'decimal' | 'numeric' | 'text'
  groupDigitsOnBlur?: boolean
  className?: string
}

export function AmountField({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  hint,
  error,
  inputMode = 'decimal',
  groupDigitsOnBlur = false,
  className = '',
}: AmountFieldProps) {
  const id = useId()
  const descriptionId = `${id}-description`
  const description = error ?? hint

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-muted">
        {label}
      </label>
      <div
        className={`flex items-center rounded-md border bg-sheet transition-colors focus-within:border-focus focus-within:ring-1 focus-within:ring-focus ${
          error ? 'border-error' : 'border-rule'
        }`}
      >
        {prefix && (
          <span aria-hidden="true" className="figures pl-3 text-lg text-muted">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onBlur={groupDigitsOnBlur ? () => onChange(formatAmountInput(value)) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={description ? descriptionId : undefined}
          className={`figures min-w-0 flex-1 bg-transparent py-2.5 pr-3 text-lg outline-none placeholder:text-muted/60 focus-visible:outline-none ${
            prefix ? 'pl-1' : 'pl-3'
          }`}
        />
      </div>
      {description && (
        <p id={descriptionId} className={`text-sm ${error ? 'text-error' : 'text-muted'}`}>
          {description}
        </p>
      )}
    </div>
  )
}
