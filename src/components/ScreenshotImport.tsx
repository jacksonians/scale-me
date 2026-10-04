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

// Browsers repeat dragover every 50-350ms during a drag
const DRAG_IDLE_MS = 1000

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
    // dragover keeps firing while a file is over the page, so its silence means the
    // drag ended somewhere we got no event for (Escape, or a quick exit past the edge)
    let idleTimer: number | undefined
    function keepDragging() {
      setDragging(true)
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => setDragging(false), DRAG_IDLE_MS)
    }
    function stopDragging() {
      window.clearTimeout(idleTimer)
      setDragging(false)
    }
    function handleDragEnter(event: DragEvent) {
      if (isFileDrag(event)) {
        keepDragging()
      }
    }
    function handleDragOver(event: DragEvent) {
      // Without this the browser refuses the drop (or opens the image itself)
      if (isFileDrag(event)) {
        event.preventDefault()
        keepDragging()
      }
    }
    function handleDragLeave(event: DragEvent) {
      // No element being entered means the pointer left the window. If a browser
      // reports that mid-page, the next dragover shows the overlay again.
      if (!event.relatedTarget) {
        stopDragging()
      }
    }
    function handleDrop(event: DragEvent) {
      stopDragging()
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
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)
    return () => {
      window.clearTimeout(idleTimer)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
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
          <p className="tnum text-sm text-ink">Read {description.summary}</p>
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
