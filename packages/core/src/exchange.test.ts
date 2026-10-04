import { describe, expect, it } from 'vitest'
import { characterFileName, CHARACTER_FILE_FORMAT, exportCharacter, importCharacter } from './exchange'
import { CHARACTER_SCHEMA_VERSION, CharacterMigrationError, migrateCharacter } from './migrations'

const character = migrateCharacter({ id: 'abc', name: 'Aria Moonwhisper', level: 4 })

describe('exportCharacter / importCharacter', () => {
  it('round-trips a character without its id', () => {
    const file = exportCharacter(character, new Date('2026-01-01T00:00:00Z'))
    expect(file.format).toBe(CHARACTER_FILE_FORMAT)
    expect(file.schemaVersion).toBe(CHARACTER_SCHEMA_VERSION)
    expect(file.exportedAt).toBe('2026-01-01T00:00:00.000Z')
    expect('id' in file.character).toBe(false)

    const imported = importCharacter(JSON.parse(JSON.stringify(file)))
    expect('id' in imported).toBe(false)
    expect(imported).toEqual(file.character)
  })

  it('upgrades characters exported by older versions', () => {
    const imported = importCharacter({ format: CHARACTER_FILE_FORMAT, character: { name: 'Old' } })
    expect(imported.schemaVersion).toBe(CHARACTER_SCHEMA_VERSION)
    expect(imported.items).toEqual([])
  })

  it('rejects files that are not character files', () => {
    expect(() => importCharacter([{ name: 'Rope' }])).toThrow(CharacterMigrationError)
    expect(() => importCharacter({ format: 'other' })).toThrow(CharacterMigrationError)
    expect(() => importCharacter({ format: CHARACTER_FILE_FORMAT, character: null })).toThrow(CharacterMigrationError)
  })
})

describe('characterFileName', () => {
  it('builds a safe file name', () => {
    expect(characterFileName({ name: 'Aria Moonwhisper' })).toBe('Aria_Moonwhisper.fablesheet.json')
    expect(characterFileName({ name: 'Ölaf / the "Bold"' })).toBe('Ölaf_the_Bold.fablesheet.json')
    expect(characterFileName({ name: '   ' })).toBe('character.fablesheet.json')
  })
})
