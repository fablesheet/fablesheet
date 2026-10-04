import { describe, expect, it } from 'vitest'
import { ITEM_CATALOG, withCatalogStats } from './index'
import { parseArmor, parseWeapon } from './parse'

describe('parseWeapon', () => {
  it('reads category, damage and properties', () => {
    expect(parseWeapon('Martial melee weapon. 1d8 slashing. Versatile (1d10).')).toEqual({
      category: 'martial',
      kind: 'melee',
      damage: '1d8',
      damageType: 'slashing',
      versatileDamage: '1d10',
      properties: ['versatile'],
      range: null,
    })
  })

  it('reads ranges, flat damage and weapons without damage', () => {
    const crossbow = parseWeapon('Simple ranged weapon. 1d8 piercing. Ammunition (range 80/320), Loading, Two-handed.')
    expect(crossbow.range).toBe('80/320')
    expect(crossbow.properties).toEqual(['ammunition', 'loading', 'two-handed'])
    expect(parseWeapon('Martial ranged weapon. 1 piercing. Ammunition (range 25/100), Loading.').damage).toBe('1')
    expect(parseWeapon('Martial ranged weapon. Special. Thrown (range 5/15).').damage).toBeNull()
  })
})

describe('parseArmor', () => {
  it('reads light, medium and heavy armor', () => {
    expect(parseArmor('Light armor. AC 11 + Dex modifier. Disadvantage on Stealth.')).toMatchObject({
      type: 'light',
      baseAc: 11,
      addDex: true,
      dexCap: null,
      stealthDisadvantage: true,
    })
    expect(parseArmor('Medium armor. AC 14 + Dex modifier (max 2).')).toMatchObject({ baseAc: 14, dexCap: 2 })
    expect(parseArmor('Heavy armor. AC 16. Str 13 required. Disadvantage on Stealth.')).toMatchObject({
      type: 'heavy',
      addDex: false,
      strengthRequired: 13,
    })
  })

  it('reads shields', () => {
    expect(parseArmor('Shield. +2 AC. Requires one free hand.')).toMatchObject({ type: 'shield', baseAc: 2 })
  })
})

describe('catalog stats', () => {
  it('has stats for every weapon and armor in the catalog', () => {
    for (const item of ITEM_CATALOG) {
      if (item.category === 'Weapon') expect(item.weapon, item.name).toBeTruthy()
      if (item.category === 'Armor') expect(item.armor, item.name).toBeTruthy()
      if (item.category !== 'Weapon') expect(item.weapon ?? null, item.name).toBeNull()
    }
  })

  it('adds stats to items saved before stats existed', () => {
    const old = { ...ITEM_CATALOG.find(i => i.name === 'Longsword')!, id: 'x', weapon: undefined }
    expect(withCatalogStats(old).weapon?.damage).toBe('1d8')
    const custom = { ...old, name: 'Sword of Bob' }
    expect(withCatalogStats(custom)).toBe(custom)
  })
})
