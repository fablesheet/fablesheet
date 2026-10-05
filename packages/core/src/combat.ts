import type { CharacterBase, TimedEffect } from './types'

/** Rounds in one minute, the usual duration of spells like Bless */
export const ROUNDS_PER_MINUTE = 10

/** Starts a combat at round 1 with the given initiative result. */
export function startCombat<C extends CharacterBase>(character: C, initiative: number): C {
  return { ...character, combat: { round: 1, initiative, spentActions: [], effects: [] } }
}

/** Ends the combat. Timed effects end with it; conditions they added are removed. */
export function endCombat<C extends CharacterBase>(character: C): C {
  if (!character.combat) return character
  const ending = character.combat.effects.filter(e => e.condition).map(e => e.name)
  return { ...character, combat: null, conditions: character.conditions.filter(c => !ending.includes(c)) }
}

/**
 * Advances to the next round: all actions are available again, timed effects lose
 * a round, and expired ones are removed (with their condition).
 */
export function nextRound<C extends CharacterBase>(character: C): C {
  const combat = character.combat
  if (!combat) return character
  const effects = combat.effects.map(e => ({ ...e, roundsLeft: e.roundsLeft - 1 }))
  const expired = effects.filter(e => e.roundsLeft <= 0)
  const expiredConditions = expired.filter(e => e.condition).map(e => e.name)
  return {
    ...character,
    combat: { ...combat, round: combat.round + 1, spentActions: [], effects: effects.filter(e => e.roundsLeft > 0) },
    conditions: character.conditions.filter(c => !expiredConditions.includes(c)),
  }
}

/** Adds an effect lasting some rounds; a condition is also put on the character. */
export function addTimedEffect<C extends CharacterBase>(character: C, effect: Omit<TimedEffect, 'id'>, id: string): C {
  if (!character.combat) return character
  const rounds = Math.max(1, Math.floor(effect.roundsLeft))
  const conditions =
    effect.condition && !character.conditions.includes(effect.name)
      ? [...character.conditions, effect.name]
      : character.conditions
  return {
    ...character,
    conditions,
    combat: { ...character.combat, effects: [...character.combat.effects, { ...effect, roundsLeft: rounds, id }] },
  }
}

/** Removes a timed effect early (and its condition). */
export function removeTimedEffect<C extends CharacterBase>(character: C, id: string): C {
  if (!character.combat) return character
  const effect = character.combat.effects.find(e => e.id === id)
  return {
    ...character,
    conditions: effect?.condition ? character.conditions.filter(c => c !== effect.name) : character.conditions,
    combat: { ...character.combat, effects: character.combat.effects.filter(e => e.id !== id) },
  }
}

/** Marks an action of this round as spent, or available again (e.g. 'action', 'reaction'). */
export function toggleAction<C extends CharacterBase>(character: C, action: string): C {
  if (!character.combat) return character
  const spent = character.combat.spentActions
  return {
    ...character,
    combat: {
      ...character.combat,
      spentActions: spent.includes(action) ? spent.filter(a => a !== action) : [...spent, action],
    },
  }
}
