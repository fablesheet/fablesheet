import type { Sides } from '@fablesheet/core'

/** Flat die silhouettes per number of sides */
const SHAPES: Record<string, string> = {
  4: 'polygon(50% 4%, 96% 92%, 4% 92%)',
  6: 'polygon(10% 10%, 90% 10%, 90% 90%, 10% 90%)',
  8: 'polygon(50% 2%, 96% 50%, 50% 98%, 4% 50%)',
  10: 'polygon(50% 2%, 96% 40%, 50% 98%, 4% 40%)',
  12: 'polygon(50% 2%, 97% 36%, 79% 95%, 21% 95%, 3% 36%)',
  20: 'polygon(50% 1%, 95% 26%, 95% 74%, 50% 99%, 5% 74%, 5% 26%)',
  100: 'polygon(50% 2%, 96% 40%, 50% 98%, 4% 40%)',
  F: 'polygon(14% 6%, 86% 6%, 94% 14%, 94% 86%, 86% 94%, 14% 94%, 6% 86%, 6% 14%)',
}

export type DieTone = 'success' | 'failure' | 'hope' | 'fear' | null

const FILLS: Record<Exclude<DieTone, null> | 'default', string> = {
  default: 'bg-fs-accent',
  success: 'bg-fs-good',
  failure: 'bg-fs-danger',
  hope: 'bg-[#d9b25f]',
  fear: 'bg-[#5d4a86]',
}

interface Props {
  sides: Sides
  value?: number | string
  size?: 'sm' | 'lg'
  dropped?: boolean
  rolling?: boolean
  highlight?: DieTone
}

/** Face of a Fudge die: +, − or blank */
function fudgeFace(value: number): string {
  return value > 0 ? '+' : value < 0 ? '−' : ' '
}

export function DieShape({ sides, value, size = 'lg', dropped = false, rolling = false, highlight = null }: Props) {
  const dimension = size === 'lg' ? 'size-16 text-xl' : 'size-9 text-xs'
  const light = highlight !== null && highlight !== 'hope'
  const shown =
    value === undefined
      ? sides === 100
        ? '%'
        : sides === 'F'
          ? '±'
          : sides
      : sides === 'F' && typeof value === 'number'
        ? fudgeFace(value)
        : value
  return (
    <span
      className={[
        'relative inline-flex items-center justify-center font-display shrink-0',
        dimension,
        dropped ? 'opacity-35' : '',
        rolling ? 'animate-die-roll' : '',
      ].join(' ')}
    >
      <span
        className={`absolute inset-0 ${FILLS[highlight ?? 'default']}`}
        style={{ clipPath: SHAPES[sides] ?? SHAPES[6] }}
      />
      <span
        className={`relative ${light ? 'text-white' : 'text-fs-on-accent'} ${sides === 4 ? 'mt-[18%]' : ''} ${dropped ? 'line-through' : ''}`}
      >
        {shown}
      </span>
    </span>
  )
}
