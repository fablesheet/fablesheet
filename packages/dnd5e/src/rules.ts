import type { AbilityName, AbilityScores, Dnd5eCharacter, ProficiencyLevel } from './types'
import { clampUsedSlots, spellSlotMaximums } from './spellcasting'

// ── Ability scores ────────────────────────────────────────────────────────────

/** Ability modifier for a score, e.g. 10 → 0, 15 → +2, 8 → -1. */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

// ── Proficiency ───────────────────────────────────────────────────────────────

/** Proficiency bonus by character level (1–20). */
export function proficiencyBonusForLevel(level: number): number {
  const clamped = Math.min(20, Math.max(1, Math.floor(level)))
  return Math.ceil(clamped / 4) + 1
}

/** Bonus added for a given proficiency level (half proficiency rounds down). */
export function proficiencyContribution(level: ProficiencyLevel, proficiencyBonus: number): number {
  switch (level) {
    case 'expertise':
      return proficiencyBonus * 2
    case 'proficient':
      return proficiencyBonus
    case 'half':
      return Math.floor(proficiencyBonus / 2)
    case 'none':
      return 0
  }
}

export function skillBonus(score: number, level: ProficiencyLevel, proficiencyBonus: number): number {
  return abilityModifier(score) + proficiencyContribution(level, proficiencyBonus)
}

export function savingThrowBonus(score: number, proficient: boolean, proficiencyBonus: number): number {
  return abilityModifier(score) + (proficient ? proficiencyBonus : 0)
}

// ── Spellcasting ──────────────────────────────────────────────────────────────

export function spellSaveDC(castingScore: number, proficiencyBonus: number): number {
  return 8 + proficiencyBonus + abilityModifier(castingScore)
}

export function spellAttackBonus(castingScore: number, proficiencyBonus: number): number {
  return proficiencyBonus + abilityModifier(castingScore)
}

// ── Carrying capacity ─────────────────────────────────────────────────────────

export interface CarryingLimits {
  /** Maximum weight in lb (Strength × 15). */
  capacity: number
  /** Variant encumbrance: speed −10 ft above this weight (Strength × 5). */
  encumberedAt: number
  /** Variant encumbrance: heavily encumbered above this weight (Strength × 10). */
  heavilyEncumberedAt: number
}

export function carryingLimits(strength: number): CarryingLimits {
  return {
    capacity: strength * 15,
    encumberedAt: strength * 5,
    heavilyEncumberedAt: strength * 10,
  }
}

// ── Hit dice & levelling ──────────────────────────────────────────────────────

/** Number of sides of a hit die string such as "d8" (defaults to 8 if unreadable). */
export function hitDieSize(die: string): number {
  const sides = Number(/d(\d+)/i.exec(die)?.[1])
  return Number.isFinite(sides) && sides > 0 ? sides : 8
}

/** Fixed hit point gain per level (the "take the average" option): half the die + 1. */
export function averageHitPointsPerLevel(dieSize: number): number {
  return dieSize / 2 + 1
}

/** Proficiency bonus, hit dice and spellcasting numbers for a level and ability scores. */
function recalculate(character: Dnd5eCharacter, level: number, scores: AbilityScores): Dnd5eCharacter {
  const proficiencyBonus = proficiencyBonusForLevel(level)
  const casting = character.spellcastingAbility as AbilityName | null
  const castingScore = casting ? scores[casting] : undefined
  return {
    ...character,
    level,
    scores,
    proficiencyBonus,
    hitDice: { ...character.hitDice, total: level, used: Math.min(character.hitDice.used, level) },
    spellSlotsUsed: clampUsedSlots(character.spellSlotsUsed, spellSlotMaximums(character.className, level)),
    spellSaveDC: castingScore !== undefined ? spellSaveDC(castingScore, proficiencyBonus) : character.spellSaveDC,
    spellAttackBonus:
      castingScore !== undefined ? spellAttackBonus(castingScore, proficiencyBonus) : character.spellAttackBonus,
  }
}

/**
 * Returns the character at a new level: proficiency bonus, hit dice, maximum hit
 * points (average per level + Constitution modifier, at least 1 per level) and
 * spellcasting numbers are recalculated. Current HP changes by the same amount.
 */
export function changeLevel(character: Dnd5eCharacter, newLevel: number): Dnd5eCharacter {
  const level = Math.min(20, Math.max(1, Math.floor(newLevel)))
  const delta = level - character.level
  if (delta === 0) return character

  const perLevel = Math.max(
    1,
    averageHitPointsPerLevel(hitDieSize(character.hitDice.die)) + abilityModifier(character.scores.constitution),
  )
  const max = Math.max(1, character.hp.max + perLevel * delta)
  const current = Math.min(max, Math.max(0, character.hp.current + perLevel * delta))

  return { ...recalculate(character, level, character.scores), hp: { ...character.hp, max, current } }
}

export interface LevelUpChoice {
  /** Hit die result for the new level: rolled, or the average */
  hitDieResult: number
  /** Ability Score Improvement, e.g. { strength: 2 } or { dexterity: 1, wisdom: 1 } */
  abilityIncreases?: Partial<Record<AbilityName, number>>
  /** Extra hit points per level from other sources, e.g. Dwarven Toughness */
  bonusHitPointsPerLevel?: number
  /** Subclass chosen at this level (keeps the current one if omitted) */
  subclass?: string | null
}

/** Highest score an Ability Score Improvement can reach. */
export const ABILITY_SCORE_MAX = 20

/**
 * Advances the character by one level. Hit points grow by the hit die result plus the
 * Constitution modifier (at least 1); a higher Constitution modifier also adds 1 HP for
 * every earlier level. Initiative follows a changed Dexterity modifier.
 */
export function levelUp(character: Dnd5eCharacter, choice: LevelUpChoice): Dnd5eCharacter {
  if (character.level >= 20) return character
  const level = character.level + 1

  const scores = { ...character.scores }
  for (const [ability, increase] of Object.entries(choice.abilityIncreases ?? {}) as [AbilityName, number][]) {
    scores[ability] = Math.min(ABILITY_SCORE_MAX, scores[ability] + Math.max(0, increase))
  }

  const conMod = abilityModifier(scores.constitution)
  const conGain = conMod - abilityModifier(character.scores.constitution)
  const gain =
    Math.max(1, Math.floor(choice.hitDieResult) + conMod) +
    conGain * character.level +
    (choice.bonusHitPointsPerLevel ?? 0)
  const max = Math.max(1, character.hp.max + gain)
  const current = Math.min(max, Math.max(0, character.hp.current + gain))
  const dexGain = abilityModifier(scores.dexterity) - abilityModifier(character.scores.dexterity)

  return {
    ...recalculate(character, level, scores),
    hp: { ...character.hp, max, current },
    initiativeBonus: character.initiativeBonus + dexGain,
    subclass: choice.subclass !== undefined ? choice.subclass : character.subclass,
  }
}

// ── Hit points ────────────────────────────────────────────────────────────────

/** Damage removes temporary hit points first, then current hit points (not below 0). */
export function applyDamage(character: Dnd5eCharacter, amount: number): Dnd5eCharacter {
  const damage = Math.max(0, Math.floor(amount))
  const fromTemp = Math.min(character.hp.temp, damage)
  const current = Math.max(0, character.hp.current - (damage - fromTemp))
  return { ...character, hp: { ...character.hp, temp: character.hp.temp - fromTemp, current } }
}

/** Healing raises current hit points up to the maximum; regaining HP from 0 resets death saves. */
export function applyHealing(character: Dnd5eCharacter, amount: number): Dnd5eCharacter {
  const healing = Math.max(0, Math.floor(amount))
  if (healing === 0) return character
  const current = Math.min(character.hp.max, character.hp.current + healing)
  return {
    ...character,
    hp: { ...character.hp, current },
    deathSaves: character.hp.current === 0 ? { successes: 0, failures: 0 } : character.deathSaves,
  }
}
