import { describe, expect, it } from 'vitest'
import { armorClass, weaponAttack } from './equipment'
import { attunedCount, canAttune, itemBonus, rechargeItems, spendCharge } from './magic'
import { migrateDnd5e } from './migrations'
import { longRest, shortRest } from './rests'
import type { Item } from './types'

function item(name: string, extra: Partial<Item> = {}): Item {
  return {
    id: name,
    name,
    category: 'Magic Item',
    description: '',
    quantity: 1,
    weight: 0,
    value: 0,
    equipped: true,
    rarity: 'Rare',
    requiresAttunement: false,
    isAttuned: false,
    notes: '',
    ...extra,
  }
}

const ring = item('Ring of Protection', {
  requiresAttunement: true,
  isAttuned: true,
  bonuses: { ac: 1, attack: 0, damage: 0, savingThrows: 1 },
})
const scores = { strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 10, charisma: 10 }

describe('magic item bonuses', () => {
  it('apply while equipped and attuned', () => {
    const hero = { className: 'Fighter', scores, items: [ring] }
    expect(armorClass(hero)).toBe(12)
    expect(itemBonus(hero, 'savingThrows')).toBe(1)
    expect(armorClass({ ...hero, items: [{ ...ring, isAttuned: false }] })).toBe(11)
    expect(armorClass({ ...hero, items: [{ ...ring, equipped: false }] })).toBe(11)
  })

  it('add a magic weapon bonus to its attack and damage', () => {
    const sword = item('Longsword +1', {
      category: 'Weapon',
      weapon: {
        category: 'martial',
        kind: 'melee',
        damage: '1d8',
        damageType: 'slashing',
        versatileDamage: '1d10',
        properties: ['versatile'],
        range: null,
      },
      bonuses: { ac: 0, attack: 1, damage: 1, savingThrows: 0 },
    })
    const attack = weaponAttack({ className: 'Fighter', scores, proficiencyBonus: 2 }, sword)
    expect(attack?.attackBonus).toBe(6)
    expect(attack?.damage).toBe('1d8 + 4')
  })

  it('limits attunement to three items', () => {
    const attuned = [1, 2, 3].map(n => item(`Item ${n}`, { requiresAttunement: true, isAttuned: true }))
    const next = item('Fourth', { requiresAttunement: true })
    expect(attunedCount(attuned)).toBe(3)
    expect(canAttune([...attuned, next], next)).toBe(false)
    expect(canAttune(attuned, attuned[0])).toBe(true)
    expect(canAttune(attuned.slice(0, 2), next)).toBe(true)
  })
})

describe('charges', () => {
  const wand = item('Wand of Magic Missiles', {
    charges: { max: 7, current: 2, recharge: 'long', regain: '1d6+1' },
  })
  const pearl = item('Charm', { charges: { max: 1, current: 0, recharge: 'short', regain: null } })

  it('spends charges but not below zero', () => {
    const hero = migrateDnd5e({ id: 'h', name: 'H', items: [wand] })
    const used = spendCharge(spendCharge(spendCharge(hero, wand.id), wand.id), wand.id)
    expect(used.items[0].charges?.current).toBe(0)
  })

  it('recharges on rests: dice for long rests, short-rest items on both', () => {
    const maxRoll = () => 0.999
    const [w, p] = rechargeItems([wand, pearl], 'long', maxRoll)
    expect(w.charges?.current).toBe(7) // 2 + 7, capped at 7
    expect(p.charges?.current).toBe(1)
    const [w2, p2] = rechargeItems([wand, pearl], 'short', maxRoll)
    expect(w2.charges?.current).toBe(2)
    expect(p2.charges?.current).toBe(1)
  })

  it('is part of short and long rests', () => {
    const hero = migrateDnd5e({
      id: 'h',
      name: 'H',
      items: [wand, pearl],
      hitDice: { die: 'd8', total: 1, used: 0 },
      hp: { current: 5, max: 8, temp: 0 },
    })
    expect(shortRest(hero, () => 0).items.map(i => i.charges?.current)).toEqual([2, 1])
    expect(longRest(hero, () => 0).items.map(i => i.charges?.current)).toEqual([4, 1])
  })
})
