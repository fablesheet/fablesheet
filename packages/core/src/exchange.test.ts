import { describe, expect, it } from 'vitest'
import { characterFileName, CHARACTER_FILE_FORMAT, exportCharacter, importCharacter } from './exchange'
import { CharacterMigrationError, migrateCharacter } from './migrations'
import { testSystem, type TestCharacter } from './testing'

const systems = [testSystem]
const character = migrateCharacter<TestCharacter>({ id: 'abc', name: 'Aria Moonwhisper', system: 'test' }, systems)

describe('exportCharacter / importCharacter', () => {
  it('round-trips a character without its id', () => {
    const file = exportCharacter(character, new Date('2026-01-01T00:00:00Z'))
    expect(file.format).toBe(CHARACTER_FILE_FORMAT)
    expect(file.system).toBe('test')
    expect(file.schemaVersion).toBe(2)
    expect(file.exportedAt).toBe('2026-01-01T00:00:00.000Z')
    expect('id' in file.character).toBe(false)

    const imported = importCharacter(JSON.parse(JSON.stringify(file)), systems)
    expect('id' in imported).toBe(false)
    expect(imported).toEqual(file.character)
  })

  it('upgrades characters exported by older versions', () => {
    const imported = importCharacter<TestCharacter>(
      { format: CHARACTER_FILE_FORMAT, character: { name: 'Old', system: 'test', hp: 4 } },
      systems,
    )
    expect(imported).toMatchObject({ schemaVersion: 2, health: 4 })
  })

  it('rejects files that are not character files', () => {
    expect(() => importCharacter([{ name: 'Rope' }], systems)).toThrow(CharacterMigrationError)
    expect(() => importCharacter({ format: 'other' }, systems)).toThrow(CharacterMigrationError)
    expect(() => importCharacter({ format: CHARACTER_FILE_FORMAT, character: null }, systems)).toThrow(
      CharacterMigrationError,
    )
  })
})

describe('characterFileName', () => {
  it('builds a safe file name', () => {
    expect(characterFileName({ name: 'Aria Moonwhisper' })).toBe('Aria_Moonwhisper.fablesheet.json')
    expect(characterFileName({ name: 'Ölaf / the "Bold"' })).toBe('Ölaf_the_Bold.fablesheet.json')
    expect(characterFileName({ name: '   ' })).toBe('character.fablesheet.json')
  })
})
