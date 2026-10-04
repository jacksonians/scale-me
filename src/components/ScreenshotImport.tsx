import { useEffect, useRef, useState, type DragEvent } from 'react'
import { describeExtraction, type ExtractedTrade, type ExtractionDescription } from '../lib/screenshot/extractTrade'
import { readScreenshot } from '../lib/screenshot/ocr'

interface ScreenshotImportProps {
  onExtracted: (trade: ExtractedTrade) => void
}

type ImportState =
  | { status: 'idle' }
  | { status: 'loading-engine' | 'reading' }
  | { status: 'done'; description: ExtractionDescription }
  | { status: 'error'; message: string }

function firstImage(files: FileList | File[] | undefined | null): File | undefined {
  return Array.from(files ?? []).find((file) => file.type.startsWith('image/'))
}

export function ScreenshotImport({ onExtracted }: ScreenshotImportProps) {
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
    if (!file) {
      setState({ status: 'error', message: "That file isn't an image. Try a PNG or JPEG screenshot." })
      return
    }
    // A newer screenshot supersedes any read still in flight
    const request = ++latestRequest.current
    const isCurrent = () => request === latestRequest.current
    setPreviewUrl(URL.createObjectURL(file))
    setState({ status: 'reading' })
    try {
      const trade = await readScreenshot(file, (stage) => {
        if (isCurrent()) {
          setState({ status: stage })
        }
      })
      if (!isCurrent()) {
        return
      }
      const description = describeExtraction(trade)
      setState({ status: 'done', description })
      if (description.foundAnything) {
        onExtractedRef.current(trade)
      }
    } catch (error) {
      console.error('Screenshot OCR failed', error)
      if (isCurrent()) {
        setState({ status: 'error', message: "Couldn't read that screenshot. Try again, or enter the trade below." })
      }
    }
  })

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const file = firstImage(event.clipboardData?.files)
      if (file) {
        event.preventDefault()
        void readRef.current(file)
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    void readRef.current(firstImage(event.dataTransfer.files))
  }

  const busy = state.status === 'loading-engine' || state.status === 'reading'

  return (
    <section aria-labelledby="screenshot-heading" className="rounded-lg border border-rule bg-sheet">
      <div className="px-4 pt-4 pb-4 sm:px-5">
        <h2 id="screenshot-heading" className="text-lg font-semibold">
          Fill from a screenshot
        </h2>
        <p className="mt-0.5 text-sm text-muted">Robinhood order or position screens. Read on your device, never uploaded.</p>

        <div
          data-testid="screenshot-dropzone"
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`mt-3 flex items-center gap-3 rounded-md border border-dashed p-3 transition-colors ${
            dragging ? 'border-focus bg-carbon-soft/20' : 'border-rule'
          }`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Screenshot preview"
              className="h-14 w-14 shrink-0 rounded border border-rule object-cover object-top"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-rule text-2xl text-muted"
            >
              ⤓
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            <label className="cursor-pointer rounded-md border border-carbon px-3 py-2 font-medium text-carbon transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus hover:bg-carbon hover:text-carbon-ink dark:border-carbon-soft dark:text-carbon-soft">
              Choose image
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
            <span className="text-sm text-muted">or drop or paste it here</span>
          </div>
        </div>
      </div>

      <div
        role="status"
        aria-busy={busy}
        className="min-h-12 border-t border-dashed border-rule px-4 py-3 text-sm text-muted sm:px-5"
      >
        <StatusMessage state={state} />
      </div>
    </section>
  )
}

function StatusMessage({ state }: { state: ImportState }) {
  switch (state.status) {
    case 'idle':
      return <p>Contracts, premium, and ticker fill in automatically.</p>
    case 'loading-engine':
      return <p>Loading the text reader (first time only)…</p>
    case 'reading':
      return <p>Reading screenshot…</p>
    case 'error':
      return <p className="text-error">{state.message}</p>
    case 'done': {
      const { description } = state
      if (!description.foundAnything) {
        return <p className="text-error">Couldn't find a Robinhood trade in that image. Enter it below.</p>
      }
      return (
        <div className="flex flex-col gap-1">
          <p className="tnum text-base text-ink">Read {description.summary}</p>
          {description.notes.map((note) => (
            <p key={note} className={note.startsWith('This looks like a sell') ? 'text-caution' : undefined}>
              {note}
            </p>
          ))}
        </div>
      )
    }
  }
}
