import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/Button'

const STORAGE_KEY = 'fablesheet-install-hint-dismissed'

function shouldShow(): boolean {
  if ('__TAURI_INTERNALS__' in window) return false
  if (window.matchMedia('(display-mode: standalone)').matches) return false
  if ((navigator as Navigator & { standalone?: boolean }).standalone) return false
  try {
    return localStorage.getItem(STORAGE_KEY) !== '1'
  } catch {
    return false
  }
}

/** In the browser: suggests adding Fablesheet to the home screen so it works offline and keeps its data. */
export function InstallHint() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(shouldShow)
  if (!visible) return null

  return (
    <div
      role="note"
      className="flex flex-wrap items-center gap-3 bg-fs-bar border border-fs-bar-line rounded-fs px-4 py-3 text-sm text-fs-bar-text"
    >
      <span className="text-lg" aria-hidden="true">
        ⤓
      </span>
      <span className="flex-1 min-w-60">{t('web.installHint')}</span>
      <Button
        onBar
        size="sm"
        variant="ghost"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, '1')
          } catch {
            // ignore
          }
          setVisible(false)
        }}
      >
        {t('web.dismiss')}
      </Button>
    </div>
  )
}
