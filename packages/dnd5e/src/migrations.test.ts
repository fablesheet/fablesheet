import { describe, expect, it } from 'vitest'
import { CharacterMigrationError } from '@fablesheet/core'
import { DND5E_SCHEMA_VERSION, migrateDnd5e } from './migrations'

describe('D&D 5e migrations', () => {
  it('upgrades an unversioned v0.1.0 document and fills missing fields', () => {
    const migrated = migrateDnd5e({ id: 'a', name: 'Old Hero', level: 3 })
    expect(migrated.schemaVersion).toBe(DND5E_SCHEMA_VERSION)
    expect(migrated.level).toBe(3)
    expect(migrated.items).toEqual([])
    expect(migrated.knownSpells).toEqual([])
    expect(migrated.currency).toEqual({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 })
  })

  it('adds descriptions to features from older versions', () => {
    const features = [{ name: 'Rage', source: 'Barbarian', usesMax: 2, usesCurrent: 1, recharge: 'long' }]
    expect(migrateDnd5e({ id: 'a', name: 'X', schemaVersion: 3, features }).features).toEqual([
      { ...features[0], description: '' },
    ])
  })

  it('keeps existing values', () => {
    const items = [{ id: 'i', name: 'Rope' }]
    expect(migrateDnd5e({ id: 'a', name: 'X', items }).items).toEqual(items)
  })

  it('leaves current documents unchanged', () => {
    const doc = { id: 'a', name: 'X', system: 'dnd5e', schemaVersion: DND5E_SCHEMA_VERSION, level: 5 }
    expect(migrateDnd5e(doc)).toEqual(doc)
  })

  it('marks old documents as D&D 5e and converts spent actions', () => {
    const migrated = migrateDnd5e({
      id: 'a',
      name: 'X',
      schemaVersion: 5,
      combat: { round: 2, initiative: 12, actionUsed: true, bonusActionUsed: false, reactionUsed: true, effects: [] },
    })
    expect(migrated.system).toBe('dnd5e')
    expect(migrated.combat).toEqual({ round: 2, initiative: 12, spentActions: ['action', 'reaction'], effects: [] })
  })

  it('rejects documents from a newer app version', () => {
    expect(() => migrateDnd5e({ name: 'X', schemaVersion: DND5E_SCHEMA_VERSION + 1 })).toThrow(CharacterMigrationError)
  })

  it('rejects invalid input', () => {
    expect(() => migrateDnd5e(null)).toThrow(CharacterMigrationError)
    expect(() => migrateDnd5e([])).toThrow(CharacterMigrationError)
    expect(() => migrateDnd5e({ id: 'a' })).toThrow(CharacterMigrationError)
  })
})
