import { useSyncExternalStore } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'fablesheet-theme'
const media = window.matchMedia('(prefers-color-scheme: light)')
const listeners = new Set<() => void>()

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // storage unavailable — follow the system
  }
  return 'system'
}

let preference = readPreference()

export function resolveTheme(pref: ThemePreference = preference): ResolvedTheme {
  if (pref === 'system') return media.matches ? 'light' : 'dark'
  return pref
}

function apply() {
  document.documentElement.dataset.theme = resolveTheme()
  listeners.forEach(l => l())
}

export function setThemePreference(next: ThemePreference) {
  preference = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // ignore — the choice just won't be remembered
  }
  apply()
}

media.addEventListener('change', () => {
  if (preference === 'system') apply()
})
apply()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Current preference (system/light/dark); re-renders when it changes. */
export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, () => preference)
}
