// Routes to backend (online) or local storage (offline / disabled).
// Components import only from here — they never touch local.ts or backend.ts directly.
import type { Character } from '@fablesheet/core'
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
function useRemote(): boolean {
  return navigator.onLine && isSyncEnabled()
}

// ── Public API (same signatures as before) ─────────────────────────────────

export async function createCharacter(character: Omit<Character, 'id'>): Promise<Character> {
  return useRemote() ? backend.backendCreate(character) : local.localCreate(character)
}

export async function getCharacters(): Promise<Character[]> {
  return useRemote() ? backend.backendGetAll() : local.localGetAll()
}

export async function getCharacter(id: string): Promise<Character> {
  return useRemote() ? backend.backendGetOne(id) : local.localGetOne(id)
}

export async function updateCharacter(id: string, character: Character): Promise<Character> {
  return useRemote() ? backend.backendUpdate(id, character) : local.localUpdate(id, character)
}

export async function deleteCharacter(id: string): Promise<void> {
  return useRemote() ? backend.backendDelete(id) : local.localDelete(id)
}
