import type { Dnd5eCharacter } from './types'
import { SPELL_LEVELS, slotsRecoverOnShortRest } from './spellcasting'
import { rechargeItems } from './magic'
import { secureRandom, type RandomSource } from '@fablesheet/core'

const EXHAUSTION = /^Exhaustion (\d)$/

/**
 * Short rest. Hit dice are spent separately (healing is rolled at the table);
 * Warlock pact slots, short-rest features and short-rest item charges come back.
 */
export function shortRest(character: Dnd5eCharacter, random: RandomSource = secureRandom): Dnd5eCharacter {
  return {
    ...character,
    items: rechargeItems(character.items, 'short', random),
    spellSlotsUsed: slotsRecoverOnShortRest(character.className)
      ? new Array<number>(SPELL_LEVELS).fill(0)
      : character.spellSlotsUsed,
    features: character.features.map(f =>
      f.recharge === 'short' && f.usesMax !== null ? { ...f, usesCurrent: f.usesMax } : f,
    ),
  }
}

/**
 * Long rest: full hit points, temporary HP gone, half of the total hit dice
 * regained (at least one), all spell slots and features restored, death saves
 * reset and exhaustion reduced by one level. Items with charges recharge.
 */
export function longRest(character: Dnd5eCharacter, random: RandomSource = secureRandom): Dnd5eCharacter {
  const regainedDice = Math.max(1, Math.floor(character.hitDice.total / 2))

  const conditions = character.conditions.flatMap(c => {
    const match = EXHAUSTION.exec(c)
    if (!match) return [c]
    const level = Number(match[1]) - 1
    return level > 0 ? [`Exhaustion ${level}`] : []
  })

  return {
    ...shortRest(character, random),
    items: rechargeItems(character.items, 'long', random),
    hp: { ...character.hp, current: character.hp.max, temp: 0 },
    hitDice: { ...character.hitDice, used: Math.max(0, character.hitDice.used - regainedDice) },
    spellSlotsUsed: new Array<number>(SPELL_LEVELS).fill(0),
    features: character.features.map(f => (f.usesMax !== null ? { ...f, usesCurrent: f.usesMax } : f)),
    deathSaves: { successes: 0, failures: 0 },
    conditions,
  }
}
