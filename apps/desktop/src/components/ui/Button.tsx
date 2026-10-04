import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Use on dark bars (header, table) instead of parchment cards */
  onBar?: boolean
}

const VARIANTS: Record<Variant, { card: string; bar: string }> = {
  primary: {
    card: 'bg-fs-accent text-fs-on-accent border-transparent hover:bg-fs-accent-hover',
    bar: 'bg-fs-accent text-fs-on-accent border-transparent hover:bg-fs-accent-hover',
  },
  secondary: {
    card: 'bg-transparent text-fs-ink border-fs-card-line hover:bg-fs-hover',
    bar: 'bg-transparent text-fs-bar-text border-fs-bar-line hover:border-fs-bar-muted',
  },
  ghost: {
    card: 'bg-transparent text-fs-ink-muted border-transparent hover:bg-fs-hover hover:text-fs-ink',
    bar: 'bg-transparent text-fs-bar-muted border-transparent hover:text-fs-bar-text',
  },
  danger: {
    card: 'bg-transparent text-fs-danger border-fs-danger/40 hover:bg-fs-danger-bg',
    bar: 'bg-transparent text-fs-danger border-fs-danger/40 hover:bg-fs-danger-bg',
  },
}

const SIZES: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 min-h-8',
  md: 'text-sm px-3.5 py-2 min-h-10',
}

export function Button({ variant = 'secondary', size = 'md', onBar = false, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={[
        'fs-focus inline-flex items-center justify-center gap-1.5 font-ui font-medium rounded-lg border cursor-pointer',
        'transition-colors disabled:opacity-40 disabled:cursor-default select-none',
        VARIANTS[variant][onBar ? 'bar' : 'card'],
        SIZES[size],
        className,
      ].join(' ')}
    />
  )
}
