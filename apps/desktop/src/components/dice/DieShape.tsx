/** Flat die silhouettes per number of sides */
const SHAPES: Record<number, string> = {
  4: 'polygon(50% 4%, 96% 92%, 4% 92%)',
  6: 'polygon(10% 10%, 90% 10%, 90% 90%, 10% 90%)',
  8: 'polygon(50% 2%, 96% 50%, 50% 98%, 4% 50%)',
  10: 'polygon(50% 2%, 96% 40%, 50% 98%, 4% 40%)',
  12: 'polygon(50% 2%, 97% 36%, 79% 95%, 21% 95%, 3% 36%)',
  20: 'polygon(50% 1%, 95% 26%, 95% 74%, 50% 99%, 5% 74%, 5% 26%)',
  100: 'polygon(50% 2%, 96% 40%, 50% 98%, 4% 40%)',
}

interface Props {
  sides: number
  value?: number | string
  size?: 'sm' | 'lg'
  dropped?: boolean
  rolling?: boolean
  highlight?: 'success' | 'failure' | null
}

export function DieShape({ sides, value, size = 'lg', dropped = false, rolling = false, highlight = null }: Props) {
  const dimension = size === 'lg' ? 'size-16 text-xl' : 'size-9 text-xs'
  const fill = highlight === 'success' ? 'bg-fs-good' : highlight === 'failure' ? 'bg-fs-danger' : 'bg-fs-accent'
  return (
    <span
      className={[
        'relative inline-flex items-center justify-center font-display shrink-0',
        dimension,
        dropped ? 'opacity-35' : '',
        rolling ? 'animate-die-roll' : '',
      ].join(' ')}
    >
      <span className={`absolute inset-0 ${fill}`} style={{ clipPath: SHAPES[sides] ?? SHAPES[6] }} />
      <span
        className={`relative ${highlight ? 'text-white' : 'text-fs-on-accent'} ${sides === 4 ? 'mt-[18%]' : ''} ${dropped ? 'line-through' : ''}`}
      >
        {value ?? (sides === 100 ? '%' : sides)}
      </span>
    </span>
  )
}
