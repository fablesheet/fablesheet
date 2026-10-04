import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Update } from '@tauri-apps/plugin-updater'
import { Button } from './ui/Button'

const isTauri = '__TAURI_INTERNALS__' in window

/** Checks for a new release on startup and offers to install it. Desktop only. */
export function UpdateBanner() {
  const { t } = useTranslation()
  const [update, setUpdate] = useState<Update | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!isTauri || import.meta.env.DEV) return
    let cancelled = false
    import('@tauri-apps/plugin-updater')
      .then(({ check }) => check())
      .then(result => {
        if (!cancelled) setUpdate(result)
      })
      .catch(e => console.warn('Update check failed', e)) // offline is fine
    return () => {
      cancelled = true
    }
  }, [])

  async function install() {
    if (!update) return
    setError(null)
    setProgress(0)
    try {
      let total = 0
      let downloaded = 0
      await update.downloadAndInstall(event => {
        if (event.event === 'Started') total = event.data.contentLength ?? 0
        if (event.event === 'Progress') {
          downloaded += event.data.chunkLength
          if (total > 0) setProgress(Math.round((downloaded / total) * 100))
        }
      })
      const { relaunch } = await import('@tauri-apps/plugin-process')
      await relaunch()
    } catch (e) {
      setError(t('update.failed', { error: String(e) }))
      setProgress(null)
    }
  }

  if (!update || dismissed) return null

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 flex flex-wrap items-center gap-3 rounded-fs px-4 py-3 font-ui text-sm bg-fs-bar text-fs-bar-text border border-fs-bar-line shadow-2xl max-w-[calc(100vw-2rem)]"
    >
      <span>{error ?? t('update.available', { version: update.version })}</span>
      {progress === null ? (
        <>
          <Button onBar size="sm" variant="primary" onClick={install}>
            {t('update.install')}
          </Button>
          <Button onBar size="sm" variant="ghost" onClick={() => setDismissed(true)}>
            {t('update.later')}
          </Button>
        </>
      ) : (
        <span className="text-fs-bar-muted">{t('update.installing', { percent: progress })}</span>
      )}
    </div>
  )
}
