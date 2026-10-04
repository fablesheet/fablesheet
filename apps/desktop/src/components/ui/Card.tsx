import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLElement> {
  /** Section heading shown as ◆ LABEL ──── */
  label?: ReactNode
  /** Extra content on the right of the label row, e.g. a small button */
  action?: ReactNode
}

/** Parchment card: the basic surface for content on the table. */
export function Card({ label, action, className = '', children, ...rest }: Props) {
  return (
    <section
      {...rest}
      className={`bg-fs-card text-fs-ink border border-fs-card-line rounded-fs px-4 py-3 font-ui ${className}`}
    >
      {(label || action) && (
        <div className="flex items-center gap-3 mb-2.5">
          {label && <h2 className="fs-section-label flex-1 m-0 font-normal">{label}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
