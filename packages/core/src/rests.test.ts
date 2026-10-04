import { describe, expect, it } from 'vitest'
import { migrateCharacter } from './migrations'
import { longRest, shortRest } from './rests'

const tired = migrateCharacter({
  id: 'c',
  name: 'Tired',
  className: 'Wizard',
  hp: { current: 3, max: 30, temp: 5 },
  hitDice: { die: 'd6', total: 5, used: 5 },
  spellSlotsUsed: [4, 3, 1, 0, 0, 0, 0, 0, 0],
  deathSaves: { successes: 1, failures: 2 },
  conditions: ['Poisoned', 'Exhaustion 2'],
  features: [
    { name: 'Arcane Recovery', source: 'Wizard', usesMax: 1, usesCurrent: 0, recharge: 'long' },
    { name: 'Second Wind', source: 'Fighter', usesMax: 1, usesCurrent: 0, recharge: 'short' },
  ],
})

describe('longRest', () => {
  const rested = longRest(tired)

  it('restores hit points and removes temporary HP', () => {
    expect(rested.hp).toEqual({ current: 30, max: 30, temp: 0 })
  })

  it('regains half the hit dice, rounded down, at least one', () => {
    expect(rested.hitDice.used).toBe(3)
    expect(longRest({ ...tired, hitDice: { die: 'd6', total: 1, used: 1 } }).hitDice.used).toBe(0)
  })

  it('restores all spell slots and features', () => {
    expect(rested.spellSlotsUsed).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(rested.features.map(f => f.usesCurrent)).toEqual([1, 1])
  })

  it('resets death saves and reduces exhaustion by one level', () => {
    expect(rested.deathSaves).toEqual({ successes: 0, failures: 0 })
    expect(rested.conditions).toEqual(['Poisoned', 'Exhaustion 1'])
    expect(longRest({ ...tired, conditions: ['Exhaustion 1'] }).conditions).toEqual([])
  })
})

describe('shortRest', () => {
  it('keeps HP and normal spell slots but restores short-rest features', () => {
    const rested = shortRest(tired)
    expect(rested.hp).toEqual(tired.hp)
    expect(rested.spellSlotsUsed).toEqual(tired.spellSlotsUsed)
    expect(rested.features.map(f => f.usesCurrent)).toEqual([0, 1])
  })

  it('restores Warlock pact slots', () => {
    const warlock = { ...tired, className: 'Warlock', spellSlotsUsed: [0, 2, 0, 0, 0, 0, 0, 0, 0] }
    expect(shortRest(warlock).spellSlotsUsed).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
  })
})
