import { describe, expect, it } from 'vitest'
import { CHARACTER_SCHEMA_VERSION, CharacterMigrationError, migrateCharacter } from './migrations'

describe('migrateCharacter', () => {
  it('upgrades an unversioned v0.1.0 document and fills missing fields', () => {
    const migrated = migrateCharacter({ id: 'a', name: 'Old Hero', level: 3 })
    expect(migrated.schemaVersion).toBe(CHARACTER_SCHEMA_VERSION)
    expect(migrated.level).toBe(3)
    expect(migrated.items).toEqual([])
    expect(migrated.knownSpells).toEqual([])
    expect(migrated.currency).toEqual({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 })
  })

  it('adds descriptions to features from older versions', () => {
    const features = [{ name: 'Rage', source: 'Barbarian', usesMax: 2, usesCurrent: 1, recharge: 'long' }]
    expect(migrateCharacter({ id: 'a', name: 'X', schemaVersion: 3, features }).features).toEqual([
      { ...features[0], description: '' },
    ])
  })

  it('keeps existing values', () => {
    const items = [{ id: 'i', name: 'Rope' }]
    expect(migrateCharacter({ id: 'a', name: 'X', items }).items).toEqual(items)
  })

  it('leaves current documents unchanged', () => {
    const doc = { id: 'a', name: 'X', schemaVersion: CHARACTER_SCHEMA_VERSION, level: 5 }
    expect(migrateCharacter(doc)).toEqual(doc)
  })

  it('rejects documents from a newer app version', () => {
    expect(() => migrateCharacter({ name: 'X', schemaVersion: CHARACTER_SCHEMA_VERSION + 1 })).toThrow(
      CharacterMigrationError,
    )
  })

  it('rejects invalid input', () => {
    expect(() => migrateCharacter(null)).toThrow(CharacterMigrationError)
    expect(() => migrateCharacter([])).toThrow(CharacterMigrationError)
    expect(() => migrateCharacter({ id: 'a' })).toThrow(CharacterMigrationError)
  })
})
