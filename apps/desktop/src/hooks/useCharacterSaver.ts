import { useCallback, useEffect, useRef } from 'react'
import type { Character } from '@fablesheet/core'
import { updateCharacter } from '../services/api'

const SAVE_DELAY_MS = 500

/**
 * Debounced persistence: call `schedule(character)` after every change; the
 * latest version is written shortly after the last change, and immediately on
 * `flush()`, when the page is hidden or the app closes.
 */
export function useCharacterSaver() {
  const pending = useRef<Character | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    const next = pending.current
    pending.current = null
    if (next) updateCharacter(next.id, next).catch(err => console.error('Failed to save character:', err))
  }, [])

  const schedule = useCallback(
    (character: Character) => {
      pending.current = character
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, SAVE_DELAY_MS)
    },
    [flush],
  )

  useEffect(() => {
    const onHide = () => flush()
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onHide)
      flush()
    }
  }, [flush])

  return { schedule, flush }
}
