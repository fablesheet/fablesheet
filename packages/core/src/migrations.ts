import type { CharacterBase } from './types'

export class CharacterMigrationError extends Error {}

export type RawDocument = Record<string, unknown>
/** Upgrades a document by one version */
export type MigrationStep = (doc: RawDocument) => RawDocument

/** What the core needs to know about a game system to read its characters. */
export interface GameSystemDefinition<C extends CharacterBase = CharacterBase> {
  id: string
  /** Current version of the system's character format */
  schemaVersion: number
  /** migrations[n] upgrades a document from version n to n + 1 */
  migrations: MigrationStep[]
  /** Optional clean-up after loading, e.g. filling in data from the system's catalogs */
  normalize?(character: C): C
}

/**
 * Characters saved before Fablesheet supported several game systems have no
 * `system` field. All of them are D&D 5e characters.
 */
export const LEGACY_SYSTEM = 'dnd5e'

function isRecord(value: unknown): value is RawDocument {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Upgrades a stored or imported character document to the current format of its
 * game system. Throws CharacterMigrationError with a user-facing message if the
 * document can't be read.
 */
export function migrateCharacter<C extends CharacterBase = CharacterBase>(
  raw: unknown,
  systems: readonly GameSystemDefinition[],
): C {
  if (!isRecord(raw)) throw new CharacterMigrationError('Character data is not an object')
  if (typeof raw.name !== 'string') throw new CharacterMigrationError('Character has no name')

  const systemId = typeof raw.system === 'string' ? raw.system : LEGACY_SYSTEM
  const system = systems.find(s => s.id === systemId)
  if (!system) {
    throw new CharacterMigrationError(
      `Character "${raw.name}" uses the game system "${systemId}", which this version of Fablesheet doesn't know. Please update the app.`,
    )
  }

  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0
  if (version > system.schemaVersion) {
    throw new CharacterMigrationError(
      `Character "${raw.name}" was saved by a newer version of Fablesheet (format ${version}). Please update the app.`,
    )
  }

  let doc = raw
  for (let v = version; v < system.schemaVersion; v++) {
    doc = system.migrations[v](doc)
  }
  const character = { ...doc, system: systemId, schemaVersion: system.schemaVersion } as unknown as CharacterBase
  return (system.normalize ? system.normalize(character) : character) as C
}
