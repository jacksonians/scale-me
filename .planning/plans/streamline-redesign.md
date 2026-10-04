# Streamline Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle scale-me as a light-only Streamline Moderne page with the answer first: rings around the contract count, speed lines carrying the scale ratio, underlined inputs, a header screenshot pill, page-wide drop, and a pinned answer line.

**Architecture:** Pure presentation change over the existing React components. Design tokens and three small CSS utilities live in `src/index.css` (Tailwind v4 `@theme`). One new pure helper (`contractCountSize`) and one new component (`PinnedAnswer`, driven by `IntersectionObserver`). Sizing math, OCR, URL state, and storage are untouched.

**Tech Stack:** Vite 8, React 19, TypeScript 7 (strict, `noUncheckedIndexedAccess`), Tailwind CSS v4, Vitest 5 + Testing Library (jsdom), `@fontsource/poiret-one`, `@fontsource-variable/jost`.

**Spec:** `.planning/specs/streamline-redesign.md` (mockup reference: `.superpowers/brainstorm/49684-1791080711/content/streamline-states-v5.html`)

## Global Constraints

- Light only: `color-scheme: light`; no `prefers-color-scheme: dark` styles anywhere.
- Tokens: ground `#EDEBE6`, ink `#1D1F24`, muted `#5E6068`, placeholder `#67696F`, accent `#0E5A4B` (the recommended number and focus ring only), error `#A3261B`, caution `#7A4E00`, rule `rgb(29 31 36 / 0.16)`, ring-line `rgb(29 31 36 / 0.13)`.
- Fonts: Poiret One for the wordmark and the recommended number only; Jost for everything else. Numbers use `tnum` (tabular, lining). Self-hosted from npm; no Google Fonts requests.
- One centered column, `max-w-[26rem]`, `px-5`, at every width. Rings are the only centered element; text below is left-aligned; input values are right-aligned.
- Focus: `2px solid` accent, `outline-offset: 3px`, on every interactive element.
- Touch targets ≥ 44px tall (pills, input hit areas).
- Sentence case. No all-caps labels. No new copy beyond the spec.
- Preserve every accessible name, label, `data-testid`, and message text the existing tests rely on ("Your trade", "Fill from a screenshot", "Contracts", "Premium per share", "Their portfolio", "Your portfolio", "Ticker (optional)", `/choose image/i`, "Copy link to this trade", `recommended-contracts`, `screenshot-dropzone`).
- Motion only on pills (150ms colors) and the pinned line (150ms slide-in), both disabled under reduced motion.
- `npm test` and `npm run build` pass at the end of every task.

## Review Focus

1. **Big contract counts:** a count like "1,250" or "125,000" must stay inside the 128px inner ring → covered by `contractCountSize` unit tests (Task 2) and the long-value visual check (Task 7).
2. **Pinned line flicker:** the pinned line must not shift page content when it appears (a sticky, in-flow element would scroll the rings back into view and loop) → Task 6 test asserts the pinned line is `fixed`.
3. **Focus hidden under the pinned line:** tabbing to an input near the top must not land it under the pinned line → `scroll-padding-top` in Task 1, checked in the Task 7 visual pass by tabbing with the line showing.
4. **Non-file drags:** dragging selected text or a link over the page must not show the overlay or an "isn't an image" error → Task 5 tests.
5. **Long input values at 375px:** "$100,000,000" or "1,000,000" contracts must remain readable in the input → Task 7 visual check at 375px.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `package.json` / lock | Font dependencies | Swap Archivo for Poiret One + Jost |
| `index.html` | Document meta | Light color scheme, theme color |
| `src/index.css` | Tokens, fonts, `tnum` / `rings` / `pill` utilities, base styles, pin-in animation | Rewrite |
| `src/lib/contractCountSize.ts` (+ test) | Font-size class for the ringed number by text length | Create |
| `src/components/AmountField.tsx` (+ test) | One labeled, underlined input row with hint/error | Restyle |
| `src/components/ReferenceTradeInputs.tsx` | "Their trade" group + reference summary | Restyle |
| `src/components/MyPortfolioInput.tsx` | "You" group | Restyle |
| `src/components/ResultCard.tsx` (+ test) | Rings, number, scale joint, caption, round-up, warnings | Rewrite markup |
| `src/components/ScaleJoint.tsx` | Speed lines + ratio line | Rewrite markup |
| `src/components/ScreenshotImport.tsx` (+ test) | Header row with pill, status strip, page-wide drop, drag overlay | Rewrite markup + drop handling |
| `src/components/PinnedAnswer.tsx` (+ test) | Fixed answer line when rings are off screen | Create |
| `src/components/ShareButton.tsx` | Pill button + status | Restyle |
| `src/components/Disclaimer.tsx` | Footer note | Restyle |
| `src/App.tsx` | Page order, refs, wiring | Modify |

---

### Task 1: Foundation (fonts, tokens, utilities)

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm), `index.html`, `src/index.css`
- Modify (class rename only): `src/App.tsx`, `src/components/*.tsx` (`figures` → `tnum`)

**Interfaces:**
- Produces: Tailwind colors `ground`, `ink`, `muted`, `placeholder`, `accent`, `error`, `caution`, `rule`, `ring-line`; font utilities `font-sans` (Jost), `font-display` (Poiret One); utilities `tnum`, `rings`, `pill`; animation `animate-pin-in`.

- [ ] **Step 1: Install dependencies and swap fonts**

```bash
npm ci
npm uninstall @fontsource-variable/archivo
npm install @fontsource/poiret-one @fontsource-variable/jost
ls node_modules/@fontsource/poiret-one/400.css node_modules/@fontsource-variable/jost/index.css
grep -o "font-family: '[^']*'" node_modules/@fontsource/poiret-one/400.css node_modules/@fontsource-variable/jost/index.css | sort -u
```

Expected: both CSS files exist; families are `'Poiret One'` and `'Jost Variable'`. If a family name differs, use the printed name in Step 2.

- [ ] **Step 2: Rewrite `src/index.css`**

```css
@import '@fontsource/poiret-one/400.css';
@import '@fontsource-variable/jost';
@import 'tailwindcss';

@theme {
  --font-sans: 'Jost Variable', 'Jost', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Poiret One', 'Jost Variable', ui-sans-serif, system-ui, sans-serif;

  --color-ground: #edebe6;
  --color-ink: #1d1f24;
  --color-muted: #5e6068;
  --color-placeholder: #67696f;
  --color-accent: #0e5a4b;
  --color-error: #a3261b;
  --color-caution: #7a4e00;
  --color-rule: rgb(29 31 36 / 0.16);
  --color-ring-line: rgb(29 31 36 / 0.13);

  --animate-pin-in: pin-in 150ms ease-out;

  @keyframes pin-in {
    from {
      opacity: 0;
      transform: translateY(-100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

/* Jost has true tabular figures, so columns of numbers line up */
@utility tnum {
  font-variant-numeric: tabular-nums lining-nums;
}

/* Concentric Streamline rings behind the answer */
@utility rings {
  background-image: repeating-radial-gradient(
    circle at center,
    transparent 0 12px,
    var(--color-ring-line) 12px 13px
  );
}

@utility pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  min-height: 2.75rem;
  padding-inline: 1rem;
  border: 1.5px solid var(--color-ink);
  border-radius: 9999px;
  transition:
    background-color 150ms,
    color 150ms;

  &:hover {
    background-color: var(--color-ink);
    color: var(--color-ground);
  }
}

@layer base {
  html {
    color-scheme: light;
    /* Keeps focused fields clear of the pinned answer line */
    scroll-padding-top: 4.5rem;
  }

  body {
    background-color: var(--color-ground);
    color: var(--color-ink);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }

  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    ::before,
    ::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

- [ ] **Step 3: Update `index.html` meta**

Replace `<meta name="color-scheme" content="light dark" />` with:

```html
    <meta name="color-scheme" content="light" />
    <meta name="theme-color" content="#EDEBE6" />
```

- [ ] **Step 4: Rename the old `figures` utility in components**

```bash
grep -rlw figures src | xargs perl -pi -e 's/\bfigures\b/tnum/g'
grep -rnw figures src || echo "no figures left"
```

Expected: `no figures left`. (Other old color classes such as `bg-sheet` and `text-carbon` become no-ops until later tasks replace them; Task 7 checks none remain.)

- [ ] **Step 5: Verify**

Run: `npm test && npm run build`
Expected: all tests pass; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json index.html src
git commit -m "Switch to Streamline tokens, Poiret One and Jost, light only"
```

---

### Task 2: `contractCountSize`

**Files:**
- Create: `src/lib/contractCountSize.ts`
- Test: `src/lib/contractCountSize.test.ts`

**Interfaces:**
- Produces: `contractCountSize(text: string): string` returning one of `'text-[88px]' | 'text-[60px]' | 'text-[40px]' | 'text-[28px]' | 'text-[24px]' | 'text-[20px]' | 'text-[15px]'`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { contractCountSize } from './contractCountSize'

describe('contractCountSize', () => {
  it.each([
    ['2', 'text-[88px]'],
    ['12', 'text-[60px]'],
    ['125', 'text-[40px]'],
    ['1,250', 'text-[28px]'],
    ['12,500', 'text-[24px]'],
    ['125,000', 'text-[20px]'],
    ['1,250,000', 'text-[15px]'],
  ])('sizes %s as %s so it fits inside the inner ring', (text, expected) => {
    expect(contractCountSize(text)).toBe(expected)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/contractCountSize.test.ts`
Expected: FAIL, cannot resolve `./contractCountSize`.

- [ ] **Step 3: Implement**

```ts
// Poiret One's "0" is 0.86em wide and the inner ring leaves about 108px, so
// longer counts step down to stay inside it. Sizes were measured, not guessed.
export function contractCountSize(text: string): string {
  if (text.length <= 1) {
    return 'text-[88px]'
  }
  if (text.length === 2) {
    return 'text-[60px]'
  }
  if (text.length === 3) {
    return 'text-[40px]'
  }
  if (text.length <= 5) {
    return 'text-[28px]'
  }
  if (text.length === 6) {
    return 'text-[24px]'
  }
  if (text.length === 7) {
    return 'text-[20px]'
  }
  return 'text-[15px]'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/contractCountSize.test.ts`
Expected: PASS (7 cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/contractCountSize.ts src/lib/contractCountSize.test.ts
git commit -m "Add contract count sizing for the ringed answer"
```

---

### Task 3: Underlined input rows, "Their trade" and "You" groups

**Files:**
- Modify: `src/components/AmountField.tsx`, `src/components/ReferenceTradeInputs.tsx`, `src/components/MyPortfolioInput.tsx`
- Test: `src/components/ReferenceTradeInputs.test.tsx` (create)

**Interfaces:**
- Consumes: Task 1 tokens and `tnum`.
- Produces: `AmountField` props unchanged except `className` is removed. `ReferenceTradeInputs` props unchanged (`summary: string | null`). Regions named "Their trade" and "You".

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MyPortfolioInput } from './MyPortfolioInput'
import { ReferenceTradeInputs } from './ReferenceTradeInputs'

const emptyTrade = { ticker: '', refContracts: '', premium: '', refPortfolio: '' }

describe('input groups', () => {
  it('groups the reference fields as their trade', () => {
    render(<ReferenceTradeInputs trade={emptyTrade} onChange={vi.fn()} errors={{}} summary={null} />)

    expect(screen.getByRole('region', { name: 'Their trade' })).toContainElement(screen.getByLabelText('Contracts'))
  })

  it('shows no summary line until the position cost is known', () => {
    render(<ReferenceTradeInputs trade={emptyTrade} onChange={vi.fn()} errors={{}} summary={null} />)

    expect(screen.queryByText(/position cost/i)).not.toBeInTheDocument()
  })

  it('shows the summary under their trade once known', () => {
    render(
      <ReferenceTradeInputs
        trade={emptyTrade}
        onChange={vi.fn()}
        errors={{}}
        summary="Position cost $125,000, 1.25% of their portfolio."
      />,
    )

    expect(screen.getByRole('region', { name: 'Their trade' })).toHaveTextContent('Position cost $125,000')
  })

  it('groups my portfolio under you, with its privacy hint', () => {
    render(<MyPortfolioInput value="" onChange={vi.fn()} />)

    const field = screen.getByLabelText('Your portfolio')
    expect(screen.getByRole('region', { name: 'You' })).toContainElement(field)
    expect(field).toHaveAccessibleDescription('Saved on this device. Never included in share links.')
  })

  it('replaces the hint with the error and marks the field invalid', () => {
    render(<MyPortfolioInput value="abc" onChange={vi.fn()} error="Enter an amount, like 40,000 or 10M." />)

    const field = screen.getByLabelText('Your portfolio')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription('Enter an amount, like 40,000 or 10M.')
  })
})
```

Check the `ReferenceTradeFields` shape in `src/lib/urlState.ts` matches `emptyTrade`; adjust the keys if it differs.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ReferenceTradeInputs.test.tsx`
Expected: FAIL on the region names ("Their trade", "You") and on the summary placeholder ("Position cost and share of portfolio appear here." matches `/position cost/i`).

- [ ] **Step 3: Rewrite `AmountField.tsx`**

```tsx
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
```

- [ ] **Step 4: Rewrite `ReferenceTradeInputs.tsx`**

```tsx
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
```

- [ ] **Step 5: Rewrite `MyPortfolioInput.tsx`**

```tsx
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
```

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: all pass, including the new file and the existing `App.test.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/components/AmountField.tsx src/components/ReferenceTradeInputs.tsx src/components/MyPortfolioInput.tsx src/components/ReferenceTradeInputs.test.tsx
git commit -m "Restyle inputs as underlined rows grouped under their trade and you"
```

---

### Task 4: Rings, scale joint, and result caption

**Files:**
- Modify: `src/components/ResultCard.tsx`, `src/components/ScaleJoint.tsx`, `src/App.tsx`
- Test: `src/components/ResultCard.test.tsx` (create)

**Interfaces:**
- Consumes: `contractCountSize(text: string): string` (Task 2); tokens, `rings`, `tnum` (Task 1).
- Produces: `ResultCard({ result: SizingResult; ticker: string; ringsRef: RefObject<HTMLDivElement | null> })`. The rings element carries `ringsRef`. `ScaleJoint({ scaleRatio: number | null })` is rendered by `ResultCard`, not `App`. App creates `const ringsRef = useRef<HTMLDivElement>(null)`; Task 6 passes the same ref to `PinnedAnswer`.

- [ ] **Step 1: Write the failing test**

```tsx
import { createRef } from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { computeSizing } from '../lib/sizing'
import { ResultCard } from './ResultCard'

const trade = { refContracts: 500, premium: 2.5, refPortfolio: 10_000_000 }

function renderResult(myPortfolio: number | null, ticker = 'NVDA') {
  render(<ResultCard result={computeSizing({ ...trade, myPortfolio })} ticker={ticker} ringsRef={createRef()} />)
  return within(screen.getByRole('region', { name: 'Your trade' }))
}

describe('ResultCard', () => {
  it('keeps the guidance for screen readers but shows only a dash before input', () => {
    const region = renderResult(null)

    expect(region.getByText(/fill in the reference trade/i)).toHaveClass('sr-only')
    expect(region.queryByTestId('recommended-contracts')).not.toBeInTheDocument()
    expect(region.getByText('Scaled to your portfolio')).toBeInTheDocument()
  })

  it('shows the count in the accent color with cost, max loss and both shares', () => {
    const region = renderResult(40_000)

    const count = region.getByTestId('recommended-contracts')
    expect(count).toHaveTextContent('2')
    expect(count).toHaveClass('text-accent', 'text-[88px]')
    expect(screen.getByRole('region', { name: 'Your trade' })).toHaveTextContent(
      'Buy 2 NVDA at $2.50 per share',
    )
    expect(region.getByText('$500')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Your trade' })).toHaveTextContent(
      '1.25% of your portfolio, theirs was 1.25%',
    )
    expect(region.getByText('1 : 250')).toBeInTheDocument()
  })

  it('names contracts when there is no ticker', () => {
    renderResult(40_000, '')

    expect(screen.getByRole('region', { name: 'Your trade' })).toHaveTextContent(
      'Buy 2 contracts at $2.50 per share',
    )
  })

  it('shows a zero in muted gray with no buy line or cost', () => {
    const region = renderResult(15_000)

    expect(region.getByTestId('recommended-contracts')).toHaveClass('text-muted')
    expect(screen.getByRole('region', { name: 'Your trade' })).not.toHaveTextContent('Buy')
    expect(screen.getByRole('region', { name: 'Your trade' })).not.toHaveTextContent('the most you can lose')
    expect(region.getByRole('status')).toHaveTextContent('$20,000')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ResultCard.test.tsx`
Expected: FAIL (`ringsRef` prop unknown is fine at runtime, but the class, caption, and `sr-only` assertions fail).

- [ ] **Step 3: Rewrite `ScaleJoint.tsx`**

```tsx
import { formatScaleRatio } from '../lib/format'

interface ScaleJointProps {
  scaleRatio: number | null
}

// The speed lines between the answer and the inputs, carrying the one number
// that explains how the copy was scaled.
export function ScaleJoint({ scaleRatio }: ScaleJointProps) {
  return (
    <div className="flex flex-col gap-2">
      <div aria-hidden="true" className="flex flex-col gap-[3px]">
        <span className="h-[1.5px] w-full rounded-full bg-ink" />
        <span className="h-[1.5px] w-[78%] rounded-full bg-ink" />
        <span className="h-[1.5px] w-[56%] rounded-full bg-ink" />
      </div>
      <p aria-live="polite" className="text-[12.5px] text-muted">
        {scaleRatio === null ? (
          'Scaled to your portfolio'
        ) : (
          <>
            Scaled <span className="tnum text-[15px] font-semibold text-ink">{formatScaleRatio(scaleRatio)}</span>
          </>
        )}
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Rewrite `ResultCard.tsx`**

```tsx
import type { RefObject } from 'react'
import { contractCountSize } from '../lib/contractCountSize'
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
              className={`font-display leading-[0.8] ${contractCountSize(count)} ${
                result.recommended > 0 ? 'text-accent' : 'text-muted'
              }`}
            >
              {count}
            </span>
          ) : (
            <span aria-hidden="true" className="font-display text-[56px] leading-[0.8] text-ink/30">
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
```

- [ ] **Step 5: Update `App.tsx`**

Add `useRef` to the React import and remove the `ScaleJoint` import. Inside `App`, add `const ringsRef = useRef<HTMLDivElement>(null)`. Replace the returned JSX with:

```tsx
  return (
    <main className="mx-auto flex max-w-[26rem] flex-col gap-6 px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-12 sm:pt-10">
      <header>
        <h1 className="font-display text-[28px] leading-none">scale-me</h1>
        <p className="mt-1 text-[12.5px] text-muted">Size their trade to your portfolio</p>
      </header>
      <ScreenshotImport onExtracted={applyScreenshot} />
      <ResultCard result={result} ticker={normalizeTicker(trade.ticker)} ringsRef={ringsRef} />
      <ReferenceTradeInputs trade={trade} onChange={updateTrade} errors={tradeErrors} summary={referenceSummary} />
      <MyPortfolioInput
        value={myPortfolio}
        onChange={setMyPortfolio}
        error={fieldErrorMessage('myPortfolio', myPortfolio, sizingErrors.myPortfolio)}
      />
      <ShareButton disabled={!hasShareableTrade} />
      <Disclaimer />
    </main>
  )
```

- [ ] **Step 6: Run the tests**

Run: `npm test && npm run typecheck`
Expected: all pass, including `App.test.tsx` ("prompts for input", "sizes the trade", "round-up", "too small").

- [ ] **Step 7: Commit**

```bash
git add src/components/ResultCard.tsx src/components/ResultCard.test.tsx src/components/ScaleJoint.tsx src/App.tsx
git commit -m "Lead with the answer in Streamline rings, ratio under the speed lines"
```

---

### Task 5: Screenshot pill, status strip, page-wide drop

**Files:**
- Modify: `src/components/ScreenshotImport.tsx`, `src/App.tsx`
- Test: `src/components/ScreenshotImport.test.tsx` (add cases)

**Interfaces:**
- Consumes: `pill`, tokens (Task 1).
- Produces: `ScreenshotImport({ onExtracted: (trade: ExtractedTrade) => void; heading?: ReactNode })`. Renders the page header row (`heading` on the left, pill on the right), then the status region, then the drag overlay (`data-testid="drop-overlay"`). App passes the wordmark block as `heading` and no longer renders its own `<header>`.

- [ ] **Step 1: Write the failing tests**

Append inside the existing `describe('ScreenshotImport', ...)` in `src/components/ScreenshotImport.test.tsx`:

```tsx
  it('names the pill by its visible text and what it does', () => {
    renderImport()

    expect(screen.getByLabelText(/choose image/i)).toHaveAccessibleName('Screenshot: choose image')
  })

  it('keeps the idle hint for screen readers only', () => {
    renderImport()

    expect(status()).toHaveClass('sr-only')
    expect(status()).toHaveTextContent('Contracts, premium, and ticker fill in automatically.')
  })

  it('shows the status strip once a screenshot is added', async () => {
    readMock.mockResolvedValue(CRWV)
    const user = userEvent.setup()
    renderImport()

    await user.upload(screen.getByLabelText(/choose image/i), image())

    expect(status()).not.toHaveClass('sr-only')
  })

  it('reads an image dropped anywhere on the page', async () => {
    readMock.mockResolvedValue(CRWV)
    const onExtracted = renderImport()

    await act(async () => {
      fireEvent.drop(document.body, { dataTransfer: { files: [image()], types: ['Files'] } })
    })

    expect(onExtracted).toHaveBeenCalledWith(CRWV)
  })

  it('reads a drop on the strip exactly once', async () => {
    readMock.mockResolvedValue(CRWV)
    renderImport()

    await act(async () => {
      fireEvent.drop(screen.getByTestId('screenshot-dropzone'), { dataTransfer: { files: [image()], types: ['Files'] } })
    })

    expect(readMock).toHaveBeenCalledTimes(1)
  })

  it('ignores drops that carry no files, like dragged text', async () => {
    renderImport()

    await act(async () => {
      fireEvent.drop(document.body, { dataTransfer: { files: [], types: ['text/plain'] } })
    })

    expect(readMock).not.toHaveBeenCalled()
    expect(status()).toHaveClass('sr-only')
  })

  it('shows a drop overlay while a file is dragged over the page', () => {
    renderImport()

    fireEvent.dragEnter(document.body, { dataTransfer: { types: ['Files'] } })
    expect(screen.getByText('Drop the screenshot to read it')).toBeInTheDocument()

    fireEvent.dragLeave(screen.getByTestId('drop-overlay'))
    expect(screen.queryByText('Drop the screenshot to read it')).not.toBeInTheDocument()
  })

  it('hides the drop overlay after the drop', async () => {
    readMock.mockResolvedValue(CRWV)
    renderImport()

    fireEvent.dragEnter(document.body, { dataTransfer: { types: ['Files'] } })
    await act(async () => {
      fireEvent.drop(screen.getByTestId('drop-overlay'), { dataTransfer: { files: [image()], types: ['Files'] } })
    })

    expect(screen.queryByTestId('drop-overlay')).not.toBeInTheDocument()
  })

  it('does not show the overlay for text drags', () => {
    renderImport()

    fireEvent.dragEnter(document.body, { dataTransfer: { types: ['text/plain'] } })

    expect(screen.queryByTestId('drop-overlay')).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/ScreenshotImport.test.tsx`
Expected: the new cases FAIL (label name, `sr-only`, page-level drop, overlay). Existing cases pass.

- [ ] **Step 3: Rewrite `ScreenshotImport.tsx`**

Keep `StatusMessage` and the `readRef` body exactly as they are today, except the `done` summary class becomes `tnum text-sm text-ink`. Replace the rest of the file above `StatusMessage` with:

```tsx
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { describeExtraction, type ExtractedTrade, type ExtractionDescription } from '../lib/screenshot/extractTrade'
import { readScreenshot } from '../lib/screenshot/ocr'

interface ScreenshotImportProps {
  onExtracted: (trade: ExtractedTrade) => void
  // The page title block, shown to the left of the Screenshot pill
  heading?: ReactNode
}

type ImportState =
  | { status: 'idle' }
  | { status: 'loading-engine' | 'reading' }
  | { status: 'done'; description: ExtractionDescription }
  | { status: 'error'; message: string }

function firstImage(files: FileList | File[] | undefined | null): File | undefined {
  return Array.from(files ?? []).find((file) => file.type.startsWith('image/'))
}

function isFileDrag(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

export function ScreenshotImport({ onExtracted, heading }: ScreenshotImportProps) {
  const [state, setState] = useState<ImportState>({ status: 'idle' })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const latestRequest = useRef(0)
  const onExtractedRef = useRef(onExtracted)
  onExtractedRef.current = onExtracted

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const readRef = useRef(async (file: File | undefined) => {
    // (unchanged from the current implementation)
  })

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const file = firstImage(event.clipboardData?.files)
      if (file) {
        event.preventDefault()
        void readRef.current(file)
      }
    }
    function handleDragEnter(event: DragEvent) {
      if (isFileDrag(event)) {
        setDragging(true)
      }
    }
    function handleDragOver(event: DragEvent) {
      // Without this the browser refuses the drop (or opens the image itself)
      if (isFileDrag(event)) {
        event.preventDefault()
      }
    }
    function handleDrop(event: DragEvent) {
      setDragging(false)
      const files = event.dataTransfer?.files
      // Dropped text or links are not ours to handle
      if (!files || files.length === 0) {
        return
      }
      event.preventDefault()
      void readRef.current(firstImage(files))
    }

    document.addEventListener('paste', handlePaste)
    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)
    return () => {
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [])

  const busy = state.status === 'loading-engine' || state.status === 'reading'
  const idle = state.status === 'idle'

  return (
    <div className="flex flex-col">
      <header className="flex items-center gap-3">
        <div className="min-w-0 flex-1">{heading}</div>
        <label className="pill shrink-0 cursor-pointer text-[13px] font-medium focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-accent">
          <span aria-hidden="true">⤒</span>
          Screenshot<span className="sr-only">: choose image</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              void readRef.current(firstImage(event.target.files))
              event.target.value = ''
            }}
          />
        </label>
      </header>
      <section
        aria-labelledby="screenshot-heading"
        data-testid="screenshot-dropzone"
        className={idle ? '' : 'mt-3 flex items-center gap-2.5 border-y border-rule py-2'}
      >
        <h2 id="screenshot-heading" className="sr-only">
          Fill from a screenshot
        </h2>
        {previewUrl && !idle && (
          <img
            src={previewUrl}
            alt="Screenshot preview"
            className="h-10 w-[30px] shrink-0 rounded-md border-[1.5px] border-ink object-cover object-top"
          />
        )}
        <div
          role="status"
          aria-busy={busy}
          className={idle ? 'sr-only' : 'min-w-0 flex-1 text-[12.5px] leading-normal text-muted'}
        >
          <StatusMessage state={state} />
        </div>
      </section>
      {dragging && (
        <div
          data-testid="drop-overlay"
          // Children ignore the pointer, so leaving the overlay means leaving the window
          onDragLeave={() => setDragging(false)}
          className="fixed inset-0 z-20 bg-ground/90 p-3"
        >
          <div className="pointer-events-none flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-ink text-lg font-medium">
            Drop the screenshot to read it
          </div>
        </div>
      )}
    </div>
  )
}
```

Replace the `// (unchanged …)` comment with the existing `readRef` body verbatim (the `if (!file)` error, `latestRequest`, preview URL, `readScreenshot` call, `describeExtraction`, and the catch). Do not leave the comment in the file.

- [ ] **Step 4: Update `App.tsx`**

Delete the `<header>…</header>` block from Task 4 and pass it to `ScreenshotImport` instead:

```tsx
      <ScreenshotImport
        onExtracted={applyScreenshot}
        heading={
          <>
            <h1 className="font-display text-[28px] leading-none">scale-me</h1>
            <p className="mt-1 text-[12.5px] text-muted">Size their trade to your portfolio</p>
          </>
        }
      />
```

- [ ] **Step 5: Run the tests**

Run: `npm test && npm run typecheck`
Expected: all pass. The existing "rejects files that are not images" test still passes (it drops a PDF, which has files, so the error shows).

- [ ] **Step 6: Commit**

```bash
git add src/components/ScreenshotImport.tsx src/components/ScreenshotImport.test.tsx src/App.tsx
git commit -m "Move screenshot import to a header pill and accept drops anywhere"
```

---

### Task 6: Pinned answer line

**Files:**
- Create: `src/components/PinnedAnswer.tsx`
- Test: `src/components/PinnedAnswer.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `ringsRef` from App (Task 4); `formatCurrency`; tokens, `animate-pin-in` (Task 1).
- Produces: `PinnedAnswer({ result: SizingResult; ticker: string; targetRef: RefObject<HTMLElement | null> })`, `data-testid="pinned-answer"`, `aria-hidden="true"`.

- [ ] **Step 1: Write the failing test**

```tsx
import { useRef } from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computeSizing, type SizingResult } from '../lib/sizing'
import { PinnedAnswer } from './PinnedAnswer'

class FakeObserver {
  static latest: FakeObserver | null = null
  constructor(readonly callback: IntersectionObserverCallback) {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/PinnedAnswer.test.tsx`
Expected: FAIL, cannot resolve `./PinnedAnswer`.

- [ ] **Step 3: Implement `PinnedAnswer.tsx`**

```tsx
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
    <div data-testid="pinned-answer" aria-hidden="true" className="fixed inset-x-0 top-0 z-10 bg-ground motion-safe:animate-pin-in">
      <div className="mx-auto max-w-[26rem] px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-baseline gap-2 border-b-[1.5px] border-ink pb-2.5">
          <span className={`font-display text-[30px] leading-[0.8] ${count > 0 ? 'text-accent' : 'text-muted'}`}>
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
```

- [ ] **Step 4: Wire into `App.tsx`**

Import `PinnedAnswer` and render it as the first child of `<main>`:

```tsx
      <PinnedAnswer result={result} ticker={normalizeTicker(trade.ticker)} targetRef={ringsRef} />
```

- [ ] **Step 5: Run the tests**

Run: `npm test && npm run typecheck`
Expected: all pass. App tests are unaffected because jsdom has no `IntersectionObserver`, so the line never renders there.

- [ ] **Step 6: Commit**

```bash
git add src/components/PinnedAnswer.tsx src/components/PinnedAnswer.test.tsx src/App.tsx
git commit -m "Pin the answer to the top when the rings scroll out of view"
```

---

### Task 7: Share pill, disclaimer, cleanup, visual verification

**Files:**
- Modify: `src/components/ShareButton.tsx`, `src/components/Disclaimer.tsx`

**Interfaces:**
- Consumes: `pill`, tokens (Task 1).

- [ ] **Step 1: Restyle `ShareButton.tsx`**

Replace the returned JSX (behavior unchanged):

```tsx
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={copyLink}
        disabled={disabled}
        className="pill w-full text-sm font-semibold disabled:cursor-not-allowed disabled:border-rule disabled:text-placeholder disabled:hover:bg-transparent disabled:hover:text-placeholder"
      >
        Copy link to this trade
      </button>
      <p aria-live="polite" className="text-[12.5px] text-muted">
        {state === 'copied' ? 'Link copied' : "Your portfolio isn't included."}
      </p>
      {state === 'manual' && (
        <label className="flex flex-col gap-1 text-[12.5px] text-muted">
          Copy this link:
          <input
            readOnly
            value={window.location.href}
            onFocus={(event) => event.currentTarget.select()}
            className="tnum border-b-[1.5px] border-ink bg-transparent pt-2 pb-1 text-sm text-ink"
          />
        </label>
      )}
    </div>
  )
```

- [ ] **Step 2: Restyle `Disclaimer.tsx`**

```tsx
export function Disclaimer() {
  return (
    <footer className="border-t border-rule pt-3 text-xs leading-relaxed text-muted">
      <p>
        scale-me is a calculator, not financial advice. It assumes you're buying calls or puts, where the most you can
        lose is the premium you pay. Confirm the order with your broker before you trade.
      </p>
    </footer>
  )
}
```

- [ ] **Step 3: Confirm no old tokens remain**

```bash
grep -rnE '(sheet|paper|carbon|caution-bg|border-focus|ring-focus|figures|dark:)' src --include='*.tsx' --include='*.css' || echo "clean"
```

Expected: `clean`. Fix any hit by mapping it to the new tokens.

- [ ] **Step 4: Run the full suite and build**

Run: `npm test && npm run build`
Expected: all pass; build succeeds.

- [ ] **Step 5: Visual verification in a real browser**

Run `npm run dev` (background), open `http://localhost:5173/scale-me/` in Playwright, and take screenshots at 375×812 and 1440×900 of:
1. Empty (fresh load, cleared storage).
2. Result: `?c=500&p=2.5&rp=10000000&t=NVDA` with your portfolio `45000` (expect 2, "Scaled 1 : 222", round-up to 3).
3. Too small: your portfolio `15000` (gray 0, amber warning, `$20,000`).
4. Error: premium `abc` (red underline, error text right-aligned).
5. Long values at 375px: their portfolio `100000000`, contracts `1000000`, your portfolio `100000000000` (inputs readable; ringed number fits).
6. Pinned line: at 375×812 with a result, scroll until the rings leave the viewport. The line appears with no content jump. Then press Tab to an input near the top and confirm it isn't hidden under the line.

Compare against `.superpowers/brainstorm/49684-1791080711/content/streamline-states-v5.html`. Fix any defect, re-run Step 4, and re-screenshot.

- [ ] **Step 6: Commit**

```bash
git add src/components/ShareButton.tsx src/components/Disclaimer.tsx
git commit -m "Restyle share link and disclaimer to finish the Streamline pass"
```
