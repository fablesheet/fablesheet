import type { Character } from './types'

/**
 * Current version of the character document format.
 *
 * Bump this and add a step to MIGRATIONS whenever the shape of `Character`
 * changes in a way that old saved data or exported files would not satisfy.
 */
export const CHARACTER_SCHEMA_VERSION = 5

type RawCharacter = Record<string, unknown>

/** MIGRATIONS[n] upgrades a document from version n to n + 1. */
const MIGRATIONS: Array<(doc: RawCharacter) => RawCharacter> = [
  // 0 → 1: documents from v0.1.0 had no version; fill in fields that may be missing
  doc => ({
    level: 1,
    subclass: null,
    experiencePoints: 0,
    conditions: [],
    inspiration: false,
    deathSaves: { successes: 0, failures: 0 },
    knownSpells: [],
    preparedSpells: [],
    features: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    languages: [],
    otherProficiencies: [],
    items: [],
    ...doc,
  }),
  // 1 → 2: personality, backstory and notes
  doc => ({
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    backstory: '',
    notes: '',
    ...doc,
  }),
  // 2 → 3: spell slot tracking
  doc => ({
    spellSlotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ...doc,
  }),
  // 3 → 4: feature descriptions
  doc => ({
    ...doc,
    features: Array.isArray(doc.features)
      ? doc.features.map(f => ({ description: '', ...(f as Record<string, unknown>) }))
      : [],
  }),
  // 4 → 5: combat tracking and concentration
  doc => ({
    concentration: null,
    combat: null,
    ...doc,
  }),
]

export class CharacterMigrationError extends Error {}

function isRecord(value: unknown): value is RawCharacter {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Upgrades a stored or imported character document to the current format. */
export function migrateCharacter(raw: unknown): Character {
  if (!isRecord(raw)) throw new CharacterMigrationError('Character data is not an object')
  if (typeof raw.name !== 'string') throw new CharacterMigrationError('Character has no name')

  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0
  if (version > CHARACTER_SCHEMA_VERSION) {
    throw new CharacterMigrationError(
      `Character "${raw.name}" was saved by a newer version of Fablesheet (format ${version}). Please update the app.`,
    )
  }

  let doc = raw
  for (let v = version; v < CHARACTER_SCHEMA_VERSION; v++) {
    doc = MIGRATIONS[v](doc)
  }
  return { ...doc, schemaVersion: CHARACTER_SCHEMA_VERSION } as unknown as Character
}
