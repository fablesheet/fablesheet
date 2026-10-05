import type { CharacterBase } from './types'
import { CharacterMigrationError, migrateCharacter, type GameSystemDefinition } from './migrations'

/** Identifies Fablesheet character files. */
export const CHARACTER_FILE_FORMAT = 'fablesheet-character'

export interface CharacterFile<C extends CharacterBase = CharacterBase> {
  format: typeof CHARACTER_FILE_FORMAT
  /** Game system of the character, also stored inside it */
  system: string
  schemaVersion: number
  exportedAt: string
  character: Omit<C, 'id'>
}

/** Wraps a character for saving to a file. The id is dropped; imports get a new one. */
export function exportCharacter<C extends CharacterBase>(character: C, now: Date = new Date()): CharacterFile<C> {
  const { id: _id, ...rest } = character
  return {
    format: CHARACTER_FILE_FORMAT,
    system: character.system,
    schemaVersion: character.schemaVersion,
    exportedAt: now.toISOString(),
    character: rest,
  }
}

/**
 * Reads a character file (parsed JSON) and returns a character ready to be
 * created, upgraded to the current format of its game system. Throws
 * CharacterMigrationError with a user-facing message if the file is not usable.
 */
export function importCharacter<C extends CharacterBase = CharacterBase>(
  file: unknown,
  systems: readonly GameSystemDefinition[],
): Omit<C, 'id'> {
  if (typeof file !== 'object' || file === null || (file as { format?: unknown }).format !== CHARACTER_FILE_FORMAT) {
    throw new CharacterMigrationError('This is not a Fablesheet character file.')
  }
  const { character } = file as { character?: unknown }
  const { id: _id, ...rest } = migrateCharacter<C>({ ...(character as object), id: '' }, systems)
  return rest
}

/** File name suggestion for an exported character, e.g. "Aria_Moonwhisper.fablesheet.json". */
export function characterFileName(character: Pick<CharacterBase, 'name'>): string {
  const base = character.name
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, '_')
    .replace(/^_+|_+$/g, '')
  return `${base || 'character'}.fablesheet.json`
}
