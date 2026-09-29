import { formatScaleRatio } from '../lib/format'

interface ScaleJointProps {
  scaleRatio: number | null
}

// The connector between the reference trade and yours: the one number that
// explains how the copy was scaled.
export function ScaleJoint({ scaleRatio }: ScaleJointProps) {
  return (
    <div className="flex items-stretch gap-3 pl-6" aria-live="polite">
      <span aria-hidden="true" className="w-px bg-rule" />
      <p className="py-3 text-sm text-muted">
        {scaleRatio === null ? (
          'Scaled to your portfolio'
        ) : (
          <>
            Scaled <span className="figures text-base font-semibold text-ink">{formatScaleRatio(scaleRatio)}</span>,
            your portfolio to theirs
          </>
        )}
      </p>
    </div>
  )
}
