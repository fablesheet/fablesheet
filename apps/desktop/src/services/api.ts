// Routes to backend (online) or local storage (offline / disabled).
// Components import only from here — they never touch local.ts or backend.ts directly.
import type { Character } from '@fablesheet/core'
import { migrateCharacter } from '@fablesheet/core'
import { withCatalogStats } from '@fablesheet/srd-data'
import * as local from './local'
import * as backend from './backend'

export { isBackendReachable } from './backend'

const SYNC_KEY = 'fablesheet-sync-enabled'

// ── Sync preference ────────────────────────────────────────────────────────

/** Returns true if the user has online sync enabled (default: false). */
export function isSyncEnabled(): boolean {
  return localStorage.getItem(SYNC_KEY) === 'true'
}

/** Persist the user's sync preference. */
export function setSyncEnabled(enabled: boolean): void {
  localStorage.setItem(SYNC_KEY, String(enabled))
}

// ── Internal router ────────────────────────────────────────────────────────

/**
 * Returns true when we should use the remote backend:
 * - browser/OS reports online
 * - user hasn't disabled sync
 */
function shouldUseRemote(): boolean {
  return navigator.onLine && isSyncEnabled()
}

// ── Public API (same signatures as before) ─────────────────────────────────

export async function createCharacter(character: Omit<Character, 'id'>): Promise<Character> {
  return shouldUseRemote() ? backend.backendCreate(character) : local.localCreate(character)
}

/** Upgrades a stored character and fills in weapon/armor stats for catalog items saved without them. */
function load(doc: unknown): Character {
  const character = migrateCharacter(doc)
  return { ...character, items: character.items.map(withCatalogStats) }
}

export async function getCharacters(): Promise<Character[]> {
  const raw = shouldUseRemote() ? await backend.backendGetAll() : await local.localGetAll()
  // One unreadable document must not hide all other characters
  return raw.flatMap(doc => {
    try {
      return [load(doc)]
    } catch (e) {
      console.error('Skipping unreadable character', e)
      return []
    }
  })
}

export async function getCharacter(id: string): Promise<Character> {
  return load(shouldUseRemote() ? await backend.backendGetOne(id) : await local.localGetOne(id))
}

export async function updateCharacter(id: string, character: Character): Promise<Character> {
  return shouldUseRemote() ? backend.backendUpdate(id, character) : local.localUpdate(id, character)
}

export async function deleteCharacter(id: string): Promise<void> {
  return shouldUseRemote() ? backend.backendDelete(id) : local.localDelete(id)
}
