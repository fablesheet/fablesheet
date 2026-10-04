import { describe, expect, it } from 'vitest'
import { ITEM_CATALOG, SPELL_CATALOG } from './index'

// Content that is NOT part of the SRD 5.1 and must never be shipped.
const NON_SRD_SPELLS = [
  'Toll the Dead',
  'Thunderclap',
  'Word of Radiance',
  'Chromatic Orb',
  'Dissonant Whispers',
  'Hex',
  'Absorb Elements',
  'Arms of Hadar',
  'Crown of Madness',
  'Dawn',
]

describe('SPELL_CATALOG', () => {
  it('has unique ids', () => {
    const ids = SPELL_CATALOG.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has valid spell levels', () => {
    for (const spell of SPELL_CATALOG) {
      expect(spell.level, spell.name).toBeGreaterThanOrEqual(0)
      expect(spell.level, spell.name).toBeLessThanOrEqual(9)
    }
  })

  it('has a description for every spell', () => {
    for (const spell of SPELL_CATALOG) {
      expect(spell.description.trim().length, spell.name).toBeGreaterThan(0)
    }
  })

  it('contains no known non-SRD spells', () => {
    const names = new Set(SPELL_CATALOG.map(s => s.name))
    for (const name of NON_SRD_SPELLS) expect(names.has(name), name).toBe(false)
  })
})

describe('ITEM_CATALOG', () => {
  it('has unique names', () => {
    const names = ITEM_CATALOG.map(i => i.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('has non-negative weight and value', () => {
    for (const item of ITEM_CATALOG) {
      expect(item.weight, item.name).toBeGreaterThanOrEqual(0)
      expect(item.value, item.name).toBeGreaterThanOrEqual(0)
    }
  })
})
