import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Update } from '@tauri-apps/plugin-updater'

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
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-sm px-4 py-2.5 font-fell-sc text-caption text-[#e8d090] shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
      style={{
        background: 'linear-gradient(160deg, #3a2208 0%, #2a1606 100%)',
        border: '1px solid rgba(200,168,75,0.4)',
      }}
    >
      <span>{error ?? t('update.available', { version: update.version })}</span>
      {progress === null ? (
        <>
          <button
            onClick={install}
            className="font-cinzel text-deco tracking-[0.12em] text-gold border border-[rgba(200,168,75,0.5)] px-3 py-1 rounded-sm cursor-pointer bg-transparent hover:border-gold"
          >
            {t('update.install')}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="font-cinzel text-deco tracking-[0.12em] text-[#8a7040] bg-transparent border-none cursor-pointer hover:text-gold"
          >
            {t('update.later')}
          </button>
        </>
      ) : (
        <span className="font-cinzel text-deco">{t('update.installing', { percent: progress })}</span>
      )}
    </div>
  )
}
