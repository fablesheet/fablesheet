import { migrateCharacter, type GameSystemDefinition, type MigrationStep } from '@fablesheet/core'
import type { Dnd5eCharacter } from './types'

/**
 * Current version of the D&D 5e character format.
 *
 * Bump this and add a step to MIGRATIONS whenever the shape of `Dnd5eCharacter`
 * changes in a way that old saved data or exported files would not satisfy.
 */
export const DND5E_SCHEMA_VERSION = 6

/** MIGRATIONS[n] upgrades a document from version n to n + 1. */
const MIGRATIONS: MigrationStep[] = [
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
  // 5 → 6: game systems. The system id is set when loading; spent actions are now a list
  doc => {
    const combat = doc.combat as Record<string, unknown> | null | undefined
    if (!combat || Array.isArray(combat.spentActions)) return doc
    const { actionUsed, bonusActionUsed, reactionUsed, ...rest } = combat
    const spentActions = [
      ...(actionUsed ? ['action'] : []),
      ...(bonusActionUsed ? ['bonusAction'] : []),
      ...(reactionUsed ? ['reaction'] : []),
    ]
    return { ...doc, combat: { ...rest, spentActions } }
  },
]

/** How the core reads and upgrades D&D 5e characters. */
export const dnd5eDefinition: GameSystemDefinition<Dnd5eCharacter> = {
  id: 'dnd5e',
  schemaVersion: DND5E_SCHEMA_VERSION,
  migrations: MIGRATIONS,
}

/** Reads a stored D&D 5e character document (mainly for tests and tools). */
export function migrateDnd5e(raw: unknown): Dnd5eCharacter {
  return migrateCharacter<Dnd5eCharacter>(raw, [dnd5eDefinition])
}
