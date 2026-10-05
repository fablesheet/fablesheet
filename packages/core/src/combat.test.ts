import { describe, expect, it } from 'vitest'
import { addTimedEffect, endCombat, nextRound, removeTimedEffect, startCombat, toggleAction } from './combat'
import { migrateCharacter } from './migrations'
import { testSystem, type TestCharacter } from './testing'

const hero = migrateCharacter<TestCharacter>({ id: 'h', name: 'Hero', system: 'test' }, [testSystem])

describe('combat rounds', () => {
  it('starts at round 1 and resets the action economy each round', () => {
    const started = toggleAction(toggleAction(startCombat(hero, 17), 'action'), 'reaction')
    expect(started.combat).toMatchObject({ round: 1, initiative: 17, spentActions: ['action', 'reaction'] })
    expect(toggleAction(started, 'action').combat?.spentActions).toEqual(['reaction'])
    const next = nextRound(started)
    expect(next.combat).toMatchObject({ round: 2, spentActions: [] })
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
