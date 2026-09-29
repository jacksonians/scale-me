import { useEffect, useState } from 'react'

const COPIED_MESSAGE_MS = 2500

interface ShareButtonProps {
  disabled: boolean
}

type ShareState = 'idle' | 'copied' | 'manual'

export function ShareButton({ disabled }: ShareButtonProps) {
  const [state, setState] = useState<ShareState>('idle')

  useEffect(() => {
    if (state !== 'copied') {
      return
    }
    const timer = window.setTimeout(() => setState('idle'), COPIED_MESSAGE_MS)
    return () => window.clearTimeout(timer)
  }, [state])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setState('copied')
    } catch {
      // Clipboard can be blocked (insecure context, permissions); let the user copy by hand
      setState('manual')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={copyLink}
          disabled={disabled}
          className="rounded-md border border-carbon px-4 py-2.5 font-medium text-carbon transition-colors hover:bg-carbon hover:text-carbon-ink disabled:cursor-not-allowed disabled:border-rule disabled:text-muted disabled:hover:bg-transparent dark:border-carbon-soft dark:text-carbon-soft"
        >
          Copy link to this trade
        </button>
        <p aria-live="polite" className="text-sm text-muted">
          {state === 'copied' ? 'Link copied' : "Your portfolio isn't included."}
        </p>
      </div>
      {state === 'manual' && (
        <label className="flex flex-col gap-1 text-sm text-muted">
          Copy this link:
          <input
            readOnly
            value={window.location.href}
            onFocus={(event) => event.currentTarget.select()}
            className="figures rounded-md border border-rule bg-sheet px-3 py-2 text-ink"
          />
        </label>
      )}
    </div>
  )
}
