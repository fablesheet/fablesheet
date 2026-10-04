import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** Panel sliding in from the right (full width on small screens). Closes on Escape and backdrop click. */
export function Drawer({ title, onClose, children, footer }: Props) {
  const { t } = useTranslation()
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:w-[min(480px,92vw)] h-full bg-fs-card text-fs-ink border-l border-fs-card-line shadow-2xl flex flex-col font-ui animate-drawer-in"
      >
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-fs-card-line">
          <h2 className="font-display text-lg font-medium m-0 flex-1 min-w-0 truncate">{title}</h2>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="fs-focus size-9 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer text-fs-ink-muted hover:bg-fs-hover hover:text-fs-ink"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto parchment-scroll px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-fs-card-line flex gap-2">{footer}</div>}
      </aside>
    </div>
  )
}
