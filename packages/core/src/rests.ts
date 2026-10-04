import type { Character } from './types'
import { SPELL_LEVELS, slotsRecoverOnShortRest } from './spellcasting'

const EXHAUSTION = /^Exhaustion (\d)$/

/**
 * Short rest. Hit dice are spent separately (healing is rolled at the table);
 * Warlock pact slots and short-rest features come back.
 */
export function shortRest(character: Character): Character {
  return {
    ...character,
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
 * reset and exhaustion reduced by one level.
 */
export function longRest(character: Character): Character {
  const regainedDice = Math.max(1, Math.floor(character.hitDice.total / 2))

  const conditions = character.conditions.flatMap(c => {
    const match = EXHAUSTION.exec(c)
    if (!match) return [c]
    const level = Number(match[1]) - 1
    return level > 0 ? [`Exhaustion ${level}`] : []
  })

  return {
    ...shortRest(character),
    hp: { ...character.hp, current: character.hp.max, temp: 0 },
    hitDice: { ...character.hitDice, used: Math.max(0, character.hitDice.used - regainedDice) },
    spellSlotsUsed: new Array<number>(SPELL_LEVELS).fill(0),
    features: character.features.map(f => (f.usesMax !== null ? { ...f, usesCurrent: f.usesMax } : f)),
    deathSaves: { successes: 0, failures: 0 },
    conditions,
  }
}
