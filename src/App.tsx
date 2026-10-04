import { useEffect, useMemo, useState } from 'react'
import { Disclaimer } from './components/Disclaimer'
import { MyPortfolioInput } from './components/MyPortfolioInput'
import { ReferenceTradeInputs } from './components/ReferenceTradeInputs'
import { ResultCard } from './components/ResultCard'
import { ScaleJoint } from './components/ScaleJoint'
import { ScreenshotImport } from './components/ScreenshotImport'
import { ShareButton } from './components/ShareButton'
import { fieldErrorMessage } from './lib/fieldErrors'
import { formatAmountInput, formatCurrency, formatPercent } from './lib/format'
import { parseAmount } from './lib/parse'
import type { ExtractedTrade } from './lib/screenshot/extractTrade'
import { computeSizing } from './lib/sizing'
import { loadMyPortfolio, saveMyPortfolio } from './lib/storage'
import { normalizeTicker, readTradeFromSearch, writeTradeToSearch, type ReferenceTradeFields } from './lib/urlState'

export default function App() {
  const [trade, setTrade] = useState<ReferenceTradeFields>(() => {
    const fromUrl = readTradeFromSearch(window.location.search)
    return {
      ...fromUrl,
      refContracts: formatAmountInput(fromUrl.refContracts),
      refPortfolio: formatAmountInput(fromUrl.refPortfolio),
    }
  })
  const [myPortfolio, setMyPortfolio] = useState(loadMyPortfolio)

  useEffect(() => {
    const search = writeTradeToSearch(trade)
    window.history.replaceState(null, '', `${window.location.pathname}${search}`)
  }, [trade])

  useEffect(() => {
    saveMyPortfolio(myPortfolio)
  }, [myPortfolio])

  const result = useMemo(
    () =>
      computeSizing({
        refContracts: parseAmount(trade.refContracts),
        premium: parseAmount(trade.premium),
        refPortfolio: parseAmount(trade.refPortfolio),
        myPortfolio: parseAmount(myPortfolio),
      }),
    [trade, myPortfolio],
  )

  // The reference summary only needs the reference fields, so show it before
  // the user has entered their own portfolio.
  const referenceSummary = useMemo(() => {
    const reference = computeSizing({
      refContracts: parseAmount(trade.refContracts),
      premium: parseAmount(trade.premium),
      refPortfolio: parseAmount(trade.refPortfolio),
      myPortfolio: 1,
    })
    return reference.ok
      ? `Position cost ${formatCurrency(reference.refCost)}, ${formatPercent(reference.refPct)} of their portfolio.`
      : null
  }, [trade])

  const sizingErrors = result.ok ? {} : result.errors
  const tradeErrors = {
    refContracts: fieldErrorMessage('refContracts', trade.refContracts, sizingErrors.refContracts),
    premium: fieldErrorMessage('premium', trade.premium, sizingErrors.premium),
    refPortfolio: fieldErrorMessage('refPortfolio', trade.refPortfolio, sizingErrors.refPortfolio),
  }

  function updateTrade(field: keyof ReferenceTradeFields, value: string) {
    setTrade((current) => ({ ...current, [field]: field === 'ticker' ? normalizeTicker(value) : value }))
  }

  // A screenshot describes a whole trade, so fields it doesn't show are cleared
  // rather than left over from the previous one. Their portfolio never appears
  // in a screenshot and is kept.
  function applyScreenshot(extracted: ExtractedTrade) {
    setTrade((current) => ({
      ...current,
      ticker: normalizeTicker(extracted.ticker ?? ''),
      refContracts: extracted.contracts === undefined ? '' : formatAmountInput(String(extracted.contracts)),
      premium: extracted.premium === undefined ? '' : extracted.premium.toFixed(2),
    }))
  }

  const hasShareableTrade = writeTradeToSearch(trade) !== ''

  return (
    <main className="mx-auto flex max-w-xl flex-col px-4 pt-8 pb-12 sm:pt-12">
      <header className="mb-6">
        <h1 className="tnum text-4xl font-bold tracking-tight">scale-me</h1>
        <p className="mt-1 text-muted">Size a big options trade down to your portfolio.</p>
      </header>

      <div className="flex flex-col gap-3">
        <ScreenshotImport onExtracted={applyScreenshot} />
        <ReferenceTradeInputs
          trade={trade}
          onChange={updateTrade}
          errors={tradeErrors}
          summary={referenceSummary}
        />
        <MyPortfolioInput
          value={myPortfolio}
          onChange={setMyPortfolio}
          error={fieldErrorMessage('myPortfolio', myPortfolio, sizingErrors.myPortfolio)}
        />
      </div>

      <ScaleJoint scaleRatio={result.ok ? result.scaleRatio : null} />

      <ResultCard result={result} ticker={normalizeTicker(trade.ticker)} />

      <div className="mt-6">
        <ShareButton disabled={!hasShareableTrade} />
      </div>

      <div className="mt-10">
        <Disclaimer />
      </div>
    </main>
  )
}
