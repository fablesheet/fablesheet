import { describe, expect, it } from 'vitest'
import { migrateCharacter } from '@fablesheet/core'
import { CLASS_CATALOG, classFeaturesAt, featuresGainedAt } from './classes'
import { hasMissingFeatures, syncFeatures } from './features'

const scores = { strength: 16, dexterity: 14, constitution: 14, intelligence: 8, wisdom: 10, charisma: 14 }

describe('class catalog', () => {
  it('covers the twelve SRD classes with their single SRD subclass', () => {
    expect(CLASS_CATALOG.map(c => c.name)).toEqual([
      'Barbarian',
      'Bard',
      'Cleric',
      'Druid',
      'Fighter',
      'Monk',
      'Paladin',
      'Ranger',
      'Rogue',
      'Sorcerer',
      'Warlock',
      'Wizard',
    ])
    for (const cls of CLASS_CATALOG) {
      const names = cls.features.map(f => f.name)
      expect(new Set(names).size, cls.name).toBe(names.length)
      for (const f of [...cls.features, ...cls.subclass.features]) {
        expect(f.summary.length, f.name).toBeGreaterThan(10)
        expect(f.level).toBeGreaterThanOrEqual(1)
        expect(f.level).toBeLessThanOrEqual(20)
      }
    }
  })

  it('scales uses with level and ability modifiers', () => {
    const rage = (level: number) => classFeaturesAt('Barbarian', null, level, scores).find(f => f.name === 'Rage')
    expect(rage(1)?.usesMax).toBe(2)
    expect(rage(6)?.usesMax).toBe(4)
    expect(rage(20)).toMatchObject({ usesMax: null, recharge: null })

    const inspiration = (level: number) =>
      classFeaturesAt('Bard', null, level, scores).find(f => f.name === 'Bardic Inspiration')
    expect(inspiration(1)).toMatchObject({ usesMax: 2, recharge: 'long' })
    expect(inspiration(5)).toMatchObject({ usesMax: 2, recharge: 'short' })
  })

  it('includes subclass features only for the SRD subclass', () => {
    expect(classFeaturesAt('Fighter', 'Champion', 3, scores).map(f => f.name)).toContain('Improved Critical')
    expect(classFeaturesAt('Fighter', 'Battle Master', 3, scores).map(f => f.name)).not.toContain('Improved Critical')
    expect(featuresGainedAt('Fighter', 'Champion', 5, scores).map(f => f.name)).toEqual(['Extra Attack'])
  })
})

describe('syncFeatures (classes)', () => {
  const barbarian = migrateCharacter({ id: 'b', name: 'Grog', className: 'Barbarian', level: 1, scores, features: [] })

  it('adds missing features and keeps custom ones', () => {
    const custom = {
      name: 'Lucky charm',
      source: 'Custom',
      description: '',
      usesMax: 1,
      usesCurrent: 1,
      recharge: 'long',
    }
    expect(hasMissingFeatures(barbarian)).toBe(true)
    const synced = syncFeatures({ ...barbarian, features: [custom] })
    expect(synced.features.map(f => f.name)).toEqual(['Rage', 'Unarmored Defense', 'Lucky charm'])
    expect(hasMissingFeatures(synced)).toBe(false)
  })

  it('keeps spent uses when the maximum grows, and removes features above the level', () => {
    const lvl2 = syncFeatures({ ...barbarian, level: 2 })
    const spent = {
      ...lvl2,
      level: 3,
      features: lvl2.features.map(f => (f.name === 'Rage' ? { ...f, usesCurrent: 0 } : f)),
    }
    const lvl3 = syncFeatures(spent)
    expect(lvl3.features.find(f => f.name === 'Rage')).toMatchObject({ usesMax: 3, usesCurrent: 1 })

    const down = syncFeatures({ ...lvl3, level: 1 })
    expect(down.features.map(f => f.name)).toEqual(['Rage', 'Unarmored Defense'])
  })

  it('leaves characters of unknown classes alone', () => {
    const homebrew = { ...barbarian, className: 'Artificer' }
    expect(syncFeatures(homebrew)).toBe(homebrew)
  })
})
