import { describe, expect, it } from 'vitest'
import { CharacterMigrationError, LEGACY_SYSTEM, migrateCharacter, type GameSystemDefinition } from './migrations'
import { testSystem } from './testing'

const legacy: GameSystemDefinition = {
  id: LEGACY_SYSTEM,
  schemaVersion: 1,
  migrations: [doc => ({ ...doc, old: true })],
}
const systems = [testSystem, legacy]

describe('migrateCharacter', () => {
  it("runs the system's migrations up to its current version", () => {
    const migrated = migrateCharacter({ id: 'a', name: 'Hero', system: 'test', hp: 7 }, systems)
    expect(migrated).toMatchObject({ system: 'test', schemaVersion: 2, luck: 0, health: 7, conditions: [] })
    expect('hp' in migrated).toBe(false)
  })

  it('continues from the stored version', () => {
    const migrated = migrateCharacter(
      { id: 'a', name: 'Hero', system: 'test', schemaVersion: 1, luck: 3, hp: 2 },
      systems,
    )
    expect(migrated).toMatchObject({ luck: 3, health: 2 })
  })

  it('treats documents without a system as legacy characters', () => {
    expect(migrateCharacter({ id: 'a', name: 'Old' }, systems)).toMatchObject({ system: LEGACY_SYSTEM, old: true })
  })

  it('applies the normalize step after loading', () => {
    const normalizing = { ...testSystem, normalize: (c: { name: string }) => ({ ...c, name: c.name.trim() }) }
    expect(migrateCharacter({ id: 'a', name: ' X ', system: 'test' }, [normalizing]).name).toBe('X')
  })

  it('rejects unknown systems and documents from newer versions', () => {
    expect(() => migrateCharacter({ name: 'X', system: 'unknown' }, systems)).toThrow(/doesn't know/)
    expect(() => migrateCharacter({ name: 'X', system: 'test', schemaVersion: 3 }, systems)).toThrow(/newer version/)
  })

  it('rejects invalid input', () => {
    expect(() => migrateCharacter(null, systems)).toThrow(CharacterMigrationError)
    expect(() => migrateCharacter([], systems)).toThrow(CharacterMigrationError)
    expect(() => migrateCharacter({ id: 'a' }, systems)).toThrow(CharacterMigrationError)
  })
})
