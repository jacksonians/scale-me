# Streamline redesign

Status: approved in brainstorming, 2026-10-03
Mockups: `.superpowers/brainstorm/49684-1791080711/content/` (`streamline-states-v5.html` is the reference)

## Goal

Rework scale-me's look so it's calmer, more tactile, and has a recognizable identity. The style is Streamline Moderne, the restrained late-1930s form of Art Deco: concentric rings, tapering speed lines, pill buttons, thin geometric numerals. The answer (how many contracts to buy) comes first and dominates the page.

The sizing math, OCR, URL state, and local storage are untouched. This is a markup, style, and layout change plus one new component (the pinned answer line).

## Decisions

| Topic | Decision |
|---|---|
| Style | Streamline Moderne. Geometry carries the Deco character, with no gold or ornament. |
| Theme | Light only. Remove the dark-mode token block. `color-scheme: light`. |
| Layout | One centered column at every width, max about 26rem. No two-column desktop layout. |
| Order | Header → rings → speed lines + ratio → result caption → inputs → Copy link → disclaimer. |
| Alignment | The rings are the only centered element. Everything below them is left-aligned, except input values, which are right-aligned. |
| Empty state | The rings show a faint dash. No visible "fill in…" sentence; the same guidance stays as screen-reader-only text. |
| Ratio | Speed lines run full width; "Scaled 1 : 222" sits on its own line below them. |
| Pinned answer | When the rings scroll out of view, a slim answer line sticks to the top, on phones and laptops. |

## Visual system

### Color (light only)

| Token | Value | Use | Contrast on base |
|---|---|---|---|
| `--color-ground` | `#EDEBE6` | Page background (limestone). Not named `base`: Tailwind's `text-base` is a font size. | — |
| `--color-ink` | `#1D1F24` | Values, headings, rules, pill borders | 13.8:1 |
| `--color-muted` | `#5E6068` | Labels, hints, captions | 5.3:1 |
| `--color-placeholder` | `#67696F` | Placeholder text (weight 400) | 4.6:1 |
| `--color-accent` | `#0E5A4B` | The recommended number and the focus ring, nothing else | 6.8:1 |
| `--color-error` | `#A3261B` | Field errors, error underline, error status text | 6.2:1 |
| `--color-caution` | `#7A4E00` | Warning bar and "looks like a sell" note | 6.0:1 |
| `--color-rule` | `rgb(29 31 36 / 0.16)` | Faint dividers (status strip, disclaimer), disabled borders | decorative |
| `--color-ring-line` | `rgb(29 31 36 / 0.13)` | Concentric ring lines | decorative |

Placeholders are told apart from typed values by weight (400 vs 500) and color (gray vs ink), not by being faint. Disabled controls and decorative lines are exempt from contrast minimums.

### Type

- **Poiret One** (`@fontsource/poiret-one`): the `scale-me` wordmark only. Its "0" is a plain circle, which inside the rings reads as another ring, so it is not used for numbers.
- **Jost at weight 200** (extralight): the recommended number in the rings and in the pinned line. Thin and geometric like Poiret One, but every digit is legible.
- **Jost** (`@fontsource-variable/jost`): everything else. It has true tabular figures; all numeric values use `font-variant-numeric: tabular-nums lining-nums`.
- Remove `@fontsource-variable/archivo` and the condensed `figures` utility. Replace `figures` with a `tnum` utility (tabular, lining figures, no width change).
- Both fonts are self-hosted from npm. No Google Fonts requests in production.

Scale: wordmark 28px; recommended number 88px (see sizing below); value inputs 17px/500; labels 13px/400; captions 14px; hints and notes 12.5px; disclaimer 12px. Body line-height 1.5. Sentence case everywhere; no all-caps labels.

### Shapes and lines

- Buttons and the Screenshot control are pills: `border: 1.5px solid ink`, `border-radius: 999px`, min height 44px.
- Inputs have no box: a 1.5px ink underline only. Error state turns the underline `--color-error`.
- Focus: `outline: 2px solid var(--color-accent); outline-offset: 3px` on every interactive element. Never removed.
- Speed lines: three 1.5px ink lines, 3px apart, widths 100% / 78% / 56%, left-anchored.

### Motion

- Pills: 150ms background/color transition on hover and active (ink fill, base-colored text).
- Pinned answer line: 150ms slide-and-fade in from the top when it appears.
- No other animation. Under `prefers-reduced-motion: reduce`, both become instant.

## Page structure

```
┌──────────────────────────────────────┐
│ scale-me                ⤒ Screenshot │  header: wordmark + subtitle, pill right
│ Size their trade to your portfolio   │
│ [thumb] Reading screenshot…          │  status strip, only after an import
│                                      │
│              ◎  2  ◎                 │  rings, centered
│              contracts               │
│ ════════════════════════════════════ │  speed lines
│ ══════════════════════════════       │
│ ═══════════════════════              │
│ Scaled 1 : 222                       │
│ Buy 2 NVDA at $2.50 per share        │  result caption, left-aligned
│ $500, the most you can lose          │
│ 1.11% of your portfolio, theirs was 1.25%
│ Rounding up to 3 would cost …        │  round-up note
│ ▌warning text                        │  warnings (amber left bar)
│                                      │
│ Their trade                          │
│ Ticker (optional)          ____NVDA  │
│ Contracts                  _____500  │
│ Premium per share          ___$2.50  │
│ Their portfolio        _$10,000,000  │
│              Total account size. …   │  hint, right-aligned under input
│ Position cost $125,000, 1.25% of …   │  reference summary
│ You                                  │
│ Your portfolio             __$45,000 │
│        Saved on this device. …       │
│ ( Copy link to this trade )          │
│ Your portfolio isn't included.       │
│ ──────────────────────────────────── │
│ A calculator, not financial advice…  │
└──────────────────────────────────────┘
```

Column: `max-width: 26rem`, centered, side padding 20px (keeps ≥ 16px gutter on a 375px phone), top padding includes `env(safe-area-inset-top)`.

## Components

### `index.css`

- Replace the `@theme` tokens with the table above; delete the `prefers-color-scheme: dark` block.
- `html { color-scheme: light }`; body background `--color-ground`, color `--color-ink`, font Jost.
- Global `:focus-visible` uses the accent ring above.
- `--font-display: 'Poiret One'`, `--font-sans: 'Jost Variable', 'Jost', ui-sans-serif, system-ui, sans-serif`.
- Utilities: `tnum`. `sr-only` is Tailwind's built-in.

### `index.html`

- `<meta name="color-scheme" content="light">`, add `<meta name="theme-color" content="#EDEBE6">`.

### `App.tsx`

New order: header (wordmark + subtitle + `ScreenshotImport`) → `ResultCard` → inputs → `ShareButton` → `Disclaimer`. `PinnedAnswer` renders once as the first child of `<main>`, outside the "Your trade" region.

`ResultCard` owns the rings element and exposes it through a `ringsRef` prop (a `RefObject<HTMLDivElement>` created in App). App passes the same ref to `PinnedAnswer`, which observes it.

`ScaleJoint` renders inside `ResultCard`, between the rings and the caption, outside the `role="status"` warning list. App passes `scaleRatio` through `ResultCard` (from `result`).

### `ResultCard` (rings + caption)

- Keeps `<section aria-labelledby="your-trade-heading">` with the heading text "Your trade", now visually hidden (`sr-only`), so `getByRole('region', { name: 'Your trade' })` keeps working.
- Rings: a 190px circle of concentric ring lines (repeating radial gradient in `--color-ring-line`), with a 128px inner circle bordered 1.5px ink on `--color-ground`. Inside: the number (`data-testid="recommended-contracts"`) and the word "contracts" / "contract" beneath it at 12px muted.
- Number size: `contractCountFontSize(text: string): number` in `src/lib/contractCountFontSize.ts` returns the largest px size that fits the inner ring: `min(88, floor(108 / (digits × 0.559 + commas × 0.285)))`, using measured Jost 200 tabular widths in em. Applied as an inline `font-size`. Examples: "2" and "12" → 88px, "125" → 64px, "1,250" → 42px, "125,000" → 29px.
- Number color: accent when `recommended > 0`; muted when `recommended === 0`.
- Empty state (`!result.ok`): the rings show an en dash "–" at 56px in 30% ink, not exposed to screen readers (`aria-hidden`). An `sr-only` paragraph reads: "Fill in the reference trade and your portfolio to see how many contracts to buy."
- Caption (when `result.ok`), left-aligned, 14px muted with ink emphasis:
  - Line 1: `Buy <b>{n} {TICKER}</b> at {premium} per share` when `recommended > 0`. When `recommended === 0`: "At the same share of your portfolio" (no "Buy").
  - Line 2: `<b>{myCost}</b>, the most you can lose`. The cost is its own element so `getByText('$500')` matches.
  - Line 3: `{myPct} of your portfolio, theirs was {refPct}`.
  - Lines 2 and 3 are shown only when `recommended > 0`; for a zero result the warning explains instead of "$0, the most you can lose".
  - Without a ticker, line 1 reads `Buy <b>{n} contracts</b> at …` (`formatContracts`).
- Round-up note (unchanged text): "Rounding up to {n} contracts would cost {cost}, {pct} of your portfolio." 12.5px muted.
- Warnings: unchanged text, `role="status"` container. Each warning is a paragraph with a 3px `--color-caution` left border, ink text, no background fill.

### `ScaleJoint`

- Renders the three speed lines (decorative, `aria-hidden`), then on the next line: "Scaled to your portfolio" when there's no ratio, otherwise `Scaled <b>{formatScaleRatio(ratio)}</b>`. The ratio stays in its own element (`getByText('1 : 250')`). Keeps `aria-live="polite"`. Left-aligned.

### `AmountField`

- Row layout: label on the left (13px muted), input on the right (fixed width about 8.5rem, right-aligned text, 17px/500 ink, transparent background, 1.5px ink underline, no box). The prefix "$" sits inside the underline, left of the value, in muted.
- Hint or error renders under the input, right-aligned, 11.5–12.5px; error text in `--color-error` and the underline turns error red. Keeps `aria-describedby`, `aria-invalid`, `inputMode`, `autoCorrect`, `autoCapitalize`, `spellCheck`, and blur-grouping behavior exactly.
- Placeholder: `--color-placeholder`, weight 400.
- The whole row is a `<label>`-linked target: clicking the label focuses the input (existing `htmlFor`).
- Touch target: the input's hit area is at least 44px tall (padding), even though the visible underline is thin.

### `ReferenceTradeInputs` and `MyPortfolioInput`

- No cards or borders. Group heading "Their trade" (13px/600 ink) for the reference fields, "You" for your portfolio. Keep `aria-labelledby` sections; heading ids may stay.
- Field labels are unchanged: "Ticker (optional)", "Contracts", "Premium per share", "Their portfolio", "Your portfolio". Hints are unchanged.
- The reference summary ("Position cost $125,000, 1.25% of their portfolio.") renders as a 12px muted line under the "Their trade" group only when available. The empty placeholder sentence ("Position cost and share of portfolio appear here.") is removed.

### `ScreenshotImport`

- Becomes two visual pieces in one `<section aria-labelledby>` region whose accessible name stays "Fill from a screenshot" (visually hidden heading):
  1. A pill in the header with visible text "⤒ Screenshot" (arrow `aria-hidden`). It's a `<label>` wrapping the visually hidden file input, with visually hidden text after "Screenshot" so the accessible name is "Screenshot: choose image". It starts with the visible word (so voice control works) and still matches `getByLabelText(/choose image/i)`. Focus inside the label shows the accent ring on the pill (`focus-within`).
  2. A status strip under the header that appears only after the first import attempt (`state.status !== 'idle'`): a 30×40 thumbnail (the preview image, 1.5px ink border, radius 6px) plus the existing status messages. Top and bottom 1px `--color-rule` dividers. Keeps `role="status"` and `aria-busy`. The strip uses `border-y` in `--color-rule`.
- Idle state shows no strip. The idle sentence ("Contracts, premium, and ticker fill in automatically.") stays available as `sr-only` text inside the status element so the region isn't empty for screen readers.
- Paste: unchanged (document-level).
- Drop: moves to the whole page. Add document-level `dragover`/`dragleave`/`drop` handlers, next to the existing paste handler. Only file drags (`dataTransfer.types` includes `Files`) are intercepted. While a file is dragged over the page, show a full-viewport overlay: a 2px dashed ink outline inset 12px from the viewport edges, with "Drop the screenshot to read it" centered on a ground-colored backdrop. The overlay is shown on a file `dragenter` anywhere and hidden on `dragleave` from the overlay itself (its children are `pointer-events: none`, so leaving the overlay means leaving the window) or on `drop`. This avoids the flicker of counting enter/leave pairs across child elements. Non-image drops show the existing "isn't an image" error.
- Keep an element with `data-testid="screenshot-dropzone"` (the section itself) so existing tests can still fire `drop` on it; the event bubbles to the document handler. The handler must not double-read when the event is handled by both.
- All existing status texts are unchanged.

### `ShareButton`

- Pill button, full column width, "Copy link to this trade". Disabled: `--color-rule` border, placeholder-color text. Status text below, left-aligned. Manual-copy fallback input uses the underline input style.

### `Disclaimer`

- 12px muted text above a 1px `--color-rule` top divider. Text unchanged.

### `PinnedAnswer` (new)

- Purpose: keep the answer visible when the rings are scrolled off screen.
- Shows only when `result.ok` and the rings element is not intersecting the viewport. Uses one `IntersectionObserver` on the rings element. If `IntersectionObserver` is undefined (old browsers, jsdom), it never shows.
- Content: the number in Jost 200 at 30px, accent colored (muted when 0), then "{TICKER} contracts, {myCost}" (ticker omitted when blank; "contract" when 1) at 14px ink. Bottom border: 1.5px ink line. Background `--color-ground`, `position: fixed` across the top of the viewport (inner content constrained to the column width), top padding includes `env(safe-area-inset-top)`, `z-index` above content. It must be out of flow: a sticky element would push content down when it appears, which can scroll the rings back into view and make the line flicker on and off.
- `html { scroll-padding-top: 4.5rem }` so a focused input or anchor is never hidden under the pinned line.
- `aria-hidden="true"`: it repeats the result, which screen readers already have.
- Lives outside the "Your trade" region so it doesn't duplicate test matches.
- Enter animation: 150ms translate-from-top + fade; instant under reduced motion.

## Accessibility

- Text contrast ≥ 4.5:1 for all text, including placeholders (see color table).
- Visible 2px accent focus ring on every interactive element.
- Touch targets ≥ 44×44px: pills, inputs (hit area), share button.
- Color is never the only signal: errors also change the message text, warnings carry text, a zero result is also stated in words.
- Screen-reader empty-state text in the result and screenshot regions.
- Reduced motion respected.

## Testing

Existing tests should mostly pass unchanged because accessible names, labels, test ids, and message texts are preserved. Update tests only where the spec intentionally changes markup, and say why in the commit.

New or changed tests:

1. **Number sizing:** the size function returns the expected class for "2", "12", "125", "1,250", "12,500".
2. **Zero styling:** a zero result renders the number with the muted style and no "Buy" caption (existing test covers "Buy").
3. **Empty state:** "Your trade" region contains the screen-reader guidance text before input (existing test covers this; it must keep passing with the text now `sr-only`).
4. **Pinned answer:** with a mocked `IntersectionObserver`, the pinned line is absent while the rings intersect, appears with the number and cost once they don't, and is absent when there's no valid result. Without `IntersectionObserver` defined, it never renders.
5. **Page-level drop:** dropping an image on `document.body` (not the dropzone) reads it; dropping a non-file drag does nothing; dropping on the dropzone reads exactly once.
6. **Drag overlay:** a file drag over the page shows "Drop the screenshot to read it"; `dragleave`/`drop` hides it.
7. **Screenshot strip:** no status strip content is visible before the first import; the idle sentence is still in the status element as screen-reader text.

Visual verification (not automated): `npm run build`, then Playwright screenshots at 375×812 and 1440×900 for the empty, result, too-small, error, and importing states, plus the pinned line after scrolling. Compare against `streamline-states-v5.html`.

## Out of scope

- Dark theme.
- Two-column desktop layout.
- Any change to sizing math, OCR parsing, URL params, or storage.
- New copy beyond what's listed here (all other texts stay as they are).
