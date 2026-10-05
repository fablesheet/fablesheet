import { describe, expect, it } from 'vitest'
import { migrateDnd5e } from '@fablesheet/dnd5e'
import { BACKGROUND_CATALOG } from './backgrounds'
import { ITEM_CATALOG } from './items'
import { RACE_CATALOG, findRace, raceAbilityBonuses, raceHitPointsPerLevel } from './races'
import { SPELL_CATALOG } from './spells'
import { syncFeatures } from './features'

const scores = { strength: 10, dexterity: 14, constitution: 12, intelligence: 14, wisdom: 10, charisma: 10 }

describe('race catalog', () => {
  it('contains the nine SRD races and only the four SRD subraces', () => {
    expect(RACE_CATALOG.map(r => r.name)).toHaveLength(9)
    expect(RACE_CATALOG.flatMap(r => (r.subrace ? [r.subrace.name] : []))).toEqual([
      'High Elf',
      'Hill Dwarf',
      'Lightfoot Halfling',
      'Rock Gnome',
    ])
  })

  it('resolves subraces and combines their ability bonuses', () => {
    expect(findRace('High Elf')?.race.name).toBe('Elf')
    expect(raceAbilityBonuses('High Elf')).toEqual({ dexterity: 2, intelligence: 1 })
    expect(raceAbilityBonuses('Elf')).toEqual({ dexterity: 2 })
    expect(raceHitPointsPerLevel('Hill Dwarf')).toBe(1)
    expect(findRace('Wood Elf')).toBeUndefined()
  })

  it('only refers to cantrips that exist in the spell catalog', () => {
    const names = new Set(SPELL_CATALOG.filter(s => s.level === 0).map(s => s.name))
    for (const race of RACE_CATALOG) {
      for (const cantrip of race.cantrips ?? []) expect(names, cantrip).toContain(cantrip)
    }
  })
})

describe('background catalog', () => {
  it('contains only the SRD background', () => {
    expect(BACKGROUND_CATALOG.map(b => b.name)).toEqual(['Acolyte'])
  })

  it('uses catalog names for gear that exists in the catalog', () => {
    const names = new Set(ITEM_CATALOG.map(i => i.name))
    expect(BACKGROUND_CATALOG[0].equipment.filter(e => names.has(e))).toEqual(['Holy Symbol', 'Pouch'])
  })
})

describe('syncFeatures (races)', () => {
  const tiefling = migrateDnd5e({ id: 't', name: 'Tief', race: 'Tiefling', className: 'Wizard', level: 1, scores })

  it('adds racial traits and unlocks level-based ones', () => {
    const lvl1 = syncFeatures(tiefling)
    expect(lvl1.features.map(f => f.name)).toContain('Infernal Legacy')
    expect(lvl1.features.map(f => f.name)).not.toContain('Infernal Legacy: Darkness')
    const lvl5 = syncFeatures({ ...lvl1, level: 5 })
    expect(lvl5.features.find(f => f.name === 'Infernal Legacy: Darkness')).toMatchObject({ usesMax: 1 })
  })

  it('keeps the description of personal traits and leaves background features alone', () => {
    const elf = syncFeatures(migrateDnd5e({ id: 'e', name: 'E', race: 'High Elf', className: 'Fighter', scores }))
    const personal = {
      ...elf,
      features: [
        ...elf.features.map(f => (f.name === 'Cantrip' ? { ...f, description: 'Fire Bolt' } : f)),
        {
          name: 'Shelter of the Faithful',
          source: 'Acolyte',
          description: '',
          usesMax: null,
          usesCurrent: null,
          recharge: null,
        },
      ],
    }
    const synced = syncFeatures({ ...personal, level: 2 })
    expect(synced.features.find(f => f.name === 'Cantrip')?.description).toBe('Fire Bolt')
    expect(synced.features.map(f => f.source)).toContain('Acolyte')
    expect(synced.features.map(f => f.source)).toContain('Elf')
  })
})
