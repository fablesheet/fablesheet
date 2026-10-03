// Offline storage: localStorage on web, Tauri SQLite on desktop.
import type { Character } from '@fablesheet/core'

const isTauri = '__TAURI_INTERNALS__' in window
const STORAGE_KEY = 'fablesheet-characters'

// ── localStorage (web offline) ─────────────────────────────────────────────

function lsRead(): Character[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function lsWrite(chars: Character[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars))
}

// ── Public functions ───────────────────────────────────────────────────────

export async function localCreate(character: Omit<Character, 'id'>): Promise<Character> {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<Character>('create_character', { character })
  }
  const created = { ...character, id: crypto.randomUUID() }
  lsWrite([...lsRead(), created])
  return created
}

export async function localGetAll(): Promise<Character[]> {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<Character[]>('get_characters')
  }
  return lsRead()
}

export async function localGetOne(id: string): Promise<Character> {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<Character>('get_character', { id })
  }
  const found = lsRead().find(c => c.id === id)
  if (!found) throw new Error(`Character ${id} not found`)
  return found
}

export async function localUpdate(id: string, character: Character): Promise<Character> {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<Character>('update_character', { id, character })
  }
  const all = lsRead()
  const idx = all.findIndex(c => c.id === id)
  if (idx === -1) throw new Error(`Character ${id} not found`)
  all[idx] = character
  lsWrite(all)
  return character
}

export async function localDelete(id: string): Promise<void> {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<void>('delete_character', { id })
  }
  lsWrite(lsRead().filter(c => c.id !== id))
}
