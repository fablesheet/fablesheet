import type { Character, CombatState, TimedEffect } from './types'
import { applyDamage } from './rules'

/** Rounds in one minute, the usual duration of spells like Bless */
export const ROUNDS_PER_MINUTE = 10

/** Starts a combat at round 1 with the given initiative result. */
export function startCombat(character: Character, initiative: number): Character {
  return {
    ...character,
    combat: { round: 1, initiative, actionUsed: false, bonusActionUsed: false, reactionUsed: false, effects: [] },
  }
}

/** Ends the combat. Timed effects end with it; conditions they added are removed. */
export function endCombat(character: Character): Character {
  if (!character.combat) return character
  const ending = character.combat.effects.filter(e => e.condition).map(e => e.name)
  return { ...character, combat: null, conditions: character.conditions.filter(c => !ending.includes(c)) }
}

/**
 * Advances to the next round: action, bonus action and reaction are available again,
 * timed effects lose a round, and expired ones are removed (with their condition).
 */
export function nextRound(character: Character): Character {
  const combat = character.combat
  if (!combat) return character
  const effects = combat.effects.map(e => ({ ...e, roundsLeft: e.roundsLeft - 1 }))
  const expired = effects.filter(e => e.roundsLeft <= 0)
  const expiredConditions = expired.filter(e => e.condition).map(e => e.name)
  return {
    ...character,
    combat: {
      ...combat,
      round: combat.round + 1,
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
      effects: effects.filter(e => e.roundsLeft > 0),
    },
    conditions: character.conditions.filter(c => !expiredConditions.includes(c)),
  }
}

/** Adds an effect lasting some rounds; a condition is also put on the character. */
export function addTimedEffect(character: Character, effect: Omit<TimedEffect, 'id'>, id: string): Character {
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
export function removeTimedEffect(character: Character, id: string): Character {
  if (!character.combat) return character
  const effect = character.combat.effects.find(e => e.id === id)
  return {
    ...character,
    conditions: effect?.condition ? character.conditions.filter(c => c !== effect.name) : character.conditions,
    combat: { ...character.combat, effects: character.combat.effects.filter(e => e.id !== id) },
  }
}

export type ActionKind = 'actionUsed' | 'bonusActionUsed' | 'reactionUsed'

export function toggleAction(character: Character, kind: ActionKind): Character {
  if (!character.combat) return character
  return { ...character, combat: { ...character.combat, [kind]: !character.combat[kind] } }
}

// ── Concentration ─────────────────────────────────────────────────────────────

/** Starts concentrating on a spell; any earlier concentration ends. */
export function startConcentration(character: Character, spellName: string): Character {
  return { ...character, concentration: spellName }
}

export function endConcentration(character: Character): Character {
  return { ...character, concentration: null }
}

/** DC of the Constitution save to keep concentration after taking damage. */
export function concentrationDC(damage: number): number {
  return Math.max(10, Math.floor(damage / 2))
}

export interface DamageResult {
  character: Character
  /** DC of the concentration save the damage calls for, or null if none is needed */
  concentrationCheck: number | null
}

/**
 * Applies damage and works out what it means for concentration: dropping to 0 HP
 * ends it right away, otherwise a Constitution save is needed.
 */
export function takeDamage(character: Character, amount: number): DamageResult {
  const damage = Math.max(0, Math.floor(amount))
  const damaged = applyDamage(character, damage)
  if (!character.concentration || damage === 0) return { character: damaged, concentrationCheck: null }
  if (damaged.hp.current === 0) return { character: endConcentration(damaged), concentrationCheck: null }
  return { character: damaged, concentrationCheck: concentrationDC(damage) }
}

export type { CombatState }
