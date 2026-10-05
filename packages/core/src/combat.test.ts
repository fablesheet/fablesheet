import { describe, expect, it } from 'vitest'
import {
  addTimedEffect,
  concentrationDC,
  endCombat,
  nextRound,
  removeTimedEffect,
  startCombat,
  startConcentration,
  takeDamage,
  toggleAction,
} from './combat'
import { migrateCharacter } from './migrations'

const hero = migrateCharacter({ id: 'h', name: 'Hero', hp: { current: 40, max: 40, temp: 0 }, conditions: [] })

describe('combat rounds', () => {
  it('starts at round 1 and resets the action economy each round', () => {
    const started = toggleAction(toggleAction(startCombat(hero, 17), 'actionUsed'), 'reactionUsed')
    expect(started.combat).toMatchObject({ round: 1, initiative: 17, actionUsed: true, reactionUsed: true })
    const next = nextRound(started)
    expect(next.combat).toMatchObject({ round: 2, actionUsed: false, bonusActionUsed: false, reactionUsed: false })
  })

  it('counts timed effects down and removes expired conditions', () => {
    let c = startCombat(hero, 10)
    c = addTimedEffect(c, { name: 'Poisoned', roundsLeft: 2, condition: true }, 'p')
    c = addTimedEffect(c, { name: 'Bless', roundsLeft: 10, condition: false }, 'b')
    expect(c.conditions).toEqual(['Poisoned'])
    c = nextRound(c)
    expect(c.combat?.effects.map(e => [e.name, e.roundsLeft])).toEqual([
      ['Poisoned', 1],
      ['Bless', 9],
    ])
    c = nextRound(c)
    expect(c.conditions).toEqual([])
    expect(c.combat?.effects.map(e => e.name)).toEqual(['Bless'])
  })

  it('removes effects early and clears them when combat ends', () => {
    let c = addTimedEffect(startCombat(hero, 10), { name: 'Prone', roundsLeft: 3, condition: true }, 'x')
    expect(removeTimedEffect(c, 'x').conditions).toEqual([])
    c = endCombat(c)
    expect(c.combat).toBeNull()
    expect(c.conditions).toEqual([])
  })

  it('ignores round actions outside of combat', () => {
    expect(nextRound(hero)).toBe(hero)
  })
})

describe('concentration', () => {
  it('uses DC 10 or half the damage, whichever is higher', () => {
    expect(concentrationDC(7)).toBe(10)
    expect(concentrationDC(30)).toBe(15)
  })

  it('asks for a save after damage and ends at 0 HP', () => {
    const focused = startConcentration(hero, 'Bless')
    expect(takeDamage(focused, 25).concentrationCheck).toBe(12)
    expect(takeDamage(hero, 25).concentrationCheck).toBeNull()
    const down = takeDamage(focused, 50)
    expect(down.concentrationCheck).toBeNull()
    expect(down.character.concentration).toBeNull()
    expect(down.character.hp.current).toBe(0)
  })
})
