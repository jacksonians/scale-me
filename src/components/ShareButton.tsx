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
}
