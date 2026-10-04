interface Props {
  total: number
  /** Number of filled pips */
  filled: number
  onChange: (filled: number) => void
  labelFilled: string
  labelEmpty: string
  /** "diamond" for spell slots, "circle" for death saves */
  shape?: 'diamond' | 'circle'
  tone?: 'brass' | 'good' | 'danger'
}

const TONES = {
  brass: 'border-fs-brass bg-fs-brass',
  good: 'border-fs-good bg-fs-good',
  danger: 'border-fs-danger bg-fs-danger',
}

/** Row of toggles; tapping pip n sets the count to n (or n−1 if it was the last filled one). */
export function Pips({ total, filled, onChange, labelFilled, labelEmpty, shape = 'diamond', tone = 'brass' }: Props) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => {
        const on = i < filled
        return (
          <button
            key={i}
            type="button"
            aria-pressed={on}
            aria-label={on ? labelFilled : labelEmpty}
            title={on ? labelFilled : labelEmpty}
            onClick={() => onChange(i + 1 === filled ? i : i + 1)}
            className="fs-focus size-8 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-md hover:bg-fs-hover"
          >
            <span
              className={[
                'block size-3 border-[1.5px]',
                shape === 'diamond' ? 'rotate-45' : 'rounded-full',
                on ? TONES[tone] : `${TONES[tone].split(' ')[0]} bg-transparent`,
              ].join(' ')}
            />
          </button>
        )
      })}
    </div>
  )
}
