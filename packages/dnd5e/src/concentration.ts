import type { Dnd5eCharacter } from './types'
import { applyDamage } from './rules'

/** Starts concentrating on a spell; any earlier concentration ends. */
export function startConcentration(character: Dnd5eCharacter, spellName: string): Dnd5eCharacter {
  return { ...character, concentration: spellName }
}

export function endConcentration(character: Dnd5eCharacter): Dnd5eCharacter {
  return { ...character, concentration: null }
}

/** DC of the Constitution save to keep concentration after taking damage. */
export function concentrationDC(damage: number): number {
  return Math.max(10, Math.floor(damage / 2))
}

export interface DamageResult {
  character: Dnd5eCharacter
  /** DC of the concentration save the damage calls for, or null if none is needed */
  concentrationCheck: number | null
}

/**
 * Applies damage and works out what it means for concentration: dropping to 0 HP
 * ends it right away, otherwise a Constitution save is needed.
 */
export function takeDamage(character: Dnd5eCharacter, amount: number): DamageResult {
  const damage = Math.max(0, Math.floor(amount))
  const damaged = applyDamage(character, damage)
  if (!character.concentration || damage === 0) return { character: damaged, concentrationCheck: null }
  if (damaged.hp.current === 0) return { character: endConcentration(damaged), concentrationCheck: null }
  return { character: damaged, concentrationCheck: concentrationDC(damage) }
}

/** Actions of a 5e turn, tracked by the combat bar */
export const DND5E_ACTIONS = ['action', 'bonusAction', 'reaction'] as const
