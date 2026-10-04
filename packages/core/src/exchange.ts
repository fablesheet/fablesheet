import type { Character } from './types'
import { CharacterMigrationError, CHARACTER_SCHEMA_VERSION, migrateCharacter } from './migrations'

/** Identifies Fablesheet character files. */
export const CHARACTER_FILE_FORMAT = 'fablesheet-character'

export interface CharacterFile {
  format: typeof CHARACTER_FILE_FORMAT
  schemaVersion: number
  exportedAt: string
  character: Omit<Character, 'id'>
}

/** Wraps a character for saving to a file. The id is dropped; imports get a new one. */
export function exportCharacter(character: Character, now: Date = new Date()): CharacterFile {
  const { id: _id, ...rest } = character
  return {
    format: CHARACTER_FILE_FORMAT,
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    character: rest,
  }
}

/**
 * Reads a character file (parsed JSON) and returns a character ready to be
 * created, upgraded to the current format. Throws CharacterMigrationError
 * with a user-facing message if the file is not usable.
 */
export function importCharacter(file: unknown): Omit<Character, 'id'> {
  if (typeof file !== 'object' || file === null || (file as { format?: unknown }).format !== CHARACTER_FILE_FORMAT) {
    throw new CharacterMigrationError('This is not a Fablesheet character file.')
  }
  const { character } = file as { character?: unknown }
  const { id: _id, ...rest } = migrateCharacter({ ...(character as object), id: '' })
  return rest
}

/** File name suggestion for an exported character, e.g. "Aria_Moonwhisper.fablesheet.json". */
export function characterFileName(character: Pick<Character, 'name'>): string {
  const base = character.name
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, '_')
    .replace(/^_+|_+$/g, '')
  return `${base || 'character'}.fablesheet.json`
}
