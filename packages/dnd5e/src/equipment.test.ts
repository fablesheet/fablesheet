import { describe, expect, it } from 'vitest'
import { armorClass, equippedAttacks, formatDamage, isProficientWithWeapon, weaponAttack } from './equipment'
import type { ArmorStats, Item, WeaponStats } from './types'

function item(name: string, extra: Partial<Item>): Item {
  return {
    id: name,
    name,
    category: 'Other',
    description: '',
    quantity: 1,
    weight: 0,
    value: 0,
    equipped: true,
    rarity: null,
    requiresAttunement: false,
    isAttuned: false,
    notes: '',
    ...extra,
  }
}
const armor = (name: string, stats: Partial<ArmorStats>) =>
  item(name, {
    category: 'Armor',
    armor: {
      type: 'light',
      baseAc: 11,
      dexCap: null,
      addDex: true,
      strengthRequired: null,
      stealthDisadvantage: false,
      ...stats,
    },
  })
const weapon = (name: string, stats: Partial<WeaponStats>) =>
  item(name, {
    category: 'Weapon',
    weapon: {
      category: 'martial',
      kind: 'melee',
      damage: '1d8',
      damageType: 'slashing',
      versatileDamage: null,
      properties: [],
      range: null,
      ...stats,
    },
  })

const scores = { strength: 16, dexterity: 14, constitution: 14, intelligence: 10, wisdom: 12, charisma: 8 }

describe('armorClass', () => {
  it('is 10 + DEX without armor', () => {
    expect(armorClass({ className: 'Wizard', scores, items: [] })).toBe(12)
  })

  it('applies light, medium and heavy armor rules', () => {
    const highDex = { ...scores, dexterity: 18 }
    expect(armorClass({ className: 'Rogue', scores: highDex, items: [armor('Leather', {})] })).toBe(15)
    expect(
      armorClass({
        className: 'Rogue',
        scores: highDex,
        items: [armor('Breastplate', { type: 'medium', baseAc: 14, dexCap: 2 })],
      }),
    ).toBe(16)
    expect(
      armorClass({
        className: 'Fighter',
        scores: highDex,
        items: [armor('Plate', { type: 'heavy', baseAc: 18, addDex: false })],
      }),
    ).toBe(18)
  })

  it('adds a shield and ignores unequipped armor', () => {
    const items = [
      armor('Chain Mail', { type: 'heavy', baseAc: 16, addDex: false }),
      armor('Shield', { type: 'shield', baseAc: 2, addDex: false }),
    ]
    expect(armorClass({ className: 'Fighter', scores, items })).toBe(18)
    expect(armorClass({ className: 'Fighter', scores, items: items.map(i => ({ ...i, equipped: false })) })).toBe(12)
  })

  it('uses Unarmored Defense for Barbarians and Monks', () => {
    expect(armorClass({ className: 'Barbarian', scores, items: [] })).toBe(14)
    expect(armorClass({ className: 'Monk', scores, items: [] })).toBe(13)
    // Monks lose it with a shield
    expect(
      armorClass({ className: 'Monk', scores, items: [armor('Shield', { type: 'shield', baseAc: 2, addDex: false })] }),
    ).toBe(14)
  })
})

describe('weapons', () => {
  const fighter = { className: 'Fighter', scores, proficiencyBonus: 2 }

  it('uses STR for melee, DEX for ranged and the better one for finesse', () => {
    expect(weaponAttack(fighter, weapon('Longsword', {}))).toMatchObject({
      attackBonus: 5,
      damage: '1d8 + 3',
      ability: 'strength',
    })
    expect(weaponAttack(fighter, weapon('Longbow', { kind: 'ranged', damageType: 'piercing' }))).toMatchObject({
      attackBonus: 4,
      damage: '1d8 + 2',
    })
    const nimble = { ...fighter, scores: { ...scores, dexterity: 18 } }
    expect(weaponAttack(nimble, weapon('Rapier', { properties: ['finesse'] }))).toMatchObject({
      ability: 'dexterity',
      attackBonus: 6,
    })
  })

  it('shows versatile damage and skips proficiency when not proficient', () => {
    const wizard = { className: 'Wizard', scores, proficiencyBonus: 2 }
    const attack = weaponAttack(wizard, weapon('Longsword', { versatileDamage: '1d10' }))!
    expect(attack.proficient).toBe(false)
    expect(attack.attackBonus).toBe(3)
    expect(attack.versatileDamage).toBe('1d10 + 3')
  })

  it('knows class weapon proficiencies', () => {
    const rapier = weapon('Rapier', {}).weapon!
    expect(isProficientWithWeapon('Rogue', 'Rapier', rapier)).toBe(true)
    expect(isProficientWithWeapon('Cleric', 'Rapier', rapier)).toBe(false)
    expect(isProficientWithWeapon('Wizard', 'Longsword', rapier, ['Longsword'])).toBe(true)
    expect(isProficientWithWeapon('Wizard', 'Longsword', rapier)).toBe(false)
    expect(isProficientWithWeapon('Cleric', 'Mace', { ...rapier, category: 'simple' })).toBe(true)
    expect(isProficientWithWeapon('Wizard', 'Quarterstaff', { ...rapier, category: 'simple' })).toBe(true)
  })

  it('lists only equipped weapons', () => {
    const items = [weapon('Longsword', {}), { ...weapon('Dagger', {}), equipped: false }, armor('Leather', {})]
    expect(equippedAttacks({ ...fighter, items }).map(a => a.name)).toEqual(['Longsword'])
  })
})

describe('formatDamage', () => {
  it('formats dice with modifiers', () => {
    expect(formatDamage('1d8', 3)).toBe('1d8 + 3')
    expect(formatDamage('1d6', 0)).toBe('1d6')
    expect(formatDamage('1d4', -1)).toBe('1d4 − 1')
    expect(formatDamage('1', 2)).toBe('3')
  })
})
