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
}: AmountFieldProps) {
  const id = useId()
  const descriptionId = `${id}-description`
  const description = error ?? hint

  return (
    <div className="flex flex-col">
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="pb-1.5 text-[13px] text-muted">
          {label}
        </label>
        <div
          className={`flex w-[9.5rem] shrink-0 items-baseline rounded-[2px] border-b-[1.5px] transition-colors focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-accent ${
            error ? 'border-error' : 'border-ink'
          }`}
        >
          {prefix && (
            <span aria-hidden="true" className="tnum text-[17px] text-muted">
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
            className="tnum min-w-0 flex-1 bg-transparent pt-4 pb-1 text-right text-[17px] font-medium outline-none placeholder:font-normal placeholder:text-placeholder focus-visible:outline-none"
          />
        </div>
      </div>
      {description && (
        <p id={descriptionId} className={`mt-1 text-right text-xs ${error ? 'text-error' : 'text-muted'}`}>
          {description}
        </p>
      )}
    </div>
  )
}
