interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}

/** Segmented control (radio group) on parchment. */
export function Segmented<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex p-0.5 rounded-lg border border-fs-card-line bg-fs-tile"
    >
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={[
            'fs-focus text-sm px-3 py-1.5 min-h-9 rounded-md cursor-pointer transition-colors font-ui',
            value === o.value ? 'bg-fs-card text-fs-ink shadow-sm' : 'text-fs-ink-muted hover:text-fs-ink',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
