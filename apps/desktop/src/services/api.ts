// Routes to backend (online) or local storage (offline / disabled).
// Components import only from here — they never touch local.ts or backend.ts directly.
import type { CharacterBase } from '@fablesheet/core'
import { migrateCharacter } from '@fablesheet/core'
import { SYSTEM_DEFINITIONS } from '../systems/definitions'
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

export async function createCharacter<C extends CharacterBase>(character: Omit<C, 'id'>): Promise<C> {
  // The storage keeps the document as it is, so the result has the same type
  return (shouldUseRemote() ? backend.backendCreate(character) : local.localCreate(character)) as Promise<C>
}

/** Upgrades a stored character to the current format of its game system. */
function load(doc: unknown): CharacterBase {
  return migrateCharacter(doc, SYSTEM_DEFINITIONS)
}

export async function getCharacters(): Promise<CharacterBase[]> {
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

export async function getCharacter(id: string): Promise<CharacterBase> {
  return load(shouldUseRemote() ? await backend.backendGetOne(id) : await local.localGetOne(id))
}

export async function updateCharacter(id: string, character: CharacterBase): Promise<CharacterBase> {
  return shouldUseRemote() ? backend.backendUpdate(id, character) : local.localUpdate(id, character)
}

export async function deleteCharacter(id: string): Promise<void> {
  return shouldUseRemote() ? backend.backendDelete(id) : local.localDelete(id)
}
