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
