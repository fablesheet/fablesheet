import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: string
}

/** Modal dialog on a parchment card. Closes on Escape and backdrop click. */
export function Dialog({ title, onClose, children, footer, width = 'min(92vw, 440px)' }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Focus the dialog once on open and restore focus on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        style={{ width }}
        className="relative bg-fs-card text-fs-ink border border-fs-card-line rounded-fs shadow-2xl font-ui outline-none animate-fade-in"
      >
        <div className="px-5 pt-4 pb-3 border-b border-fs-card-line">
          <h2 className="font-display text-lg m-0 font-medium">{title}</h2>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 pb-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
