import type { Character, ProficiencyLevel } from './types'

// ── Ability scores ────────────────────────────────────────────────────────────

/** Ability modifier for a score, e.g. 10 → 0, 15 → +2, 8 → -1. */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/** Signed display string for a modifier, e.g. 2 → "+2", -1 → "-1". */
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
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

/**
 * Returns the character at a new level: proficiency bonus, hit dice, maximum hit
 * points (average per level + Constitution modifier, at least 1 per level) and
 * spellcasting numbers are recalculated. Current HP changes by the same amount.
 */
export function changeLevel(character: Character, newLevel: number): Character {
  const level = Math.min(20, Math.max(1, Math.floor(newLevel)))
  const delta = level - character.level
  if (delta === 0) return character

  const perLevel = Math.max(
    1,
    averageHitPointsPerLevel(hitDieSize(character.hitDice.die)) + abilityModifier(character.scores.constitution),
  )
  const max = Math.max(1, character.hp.max + perLevel * delta)
  const current = Math.min(max, Math.max(0, character.hp.current + perLevel * delta))
  const proficiencyBonus = proficiencyBonusForLevel(level)
  const casting = character.spellcastingAbility as keyof Character['scores'] | null
  const castingScore = casting ? character.scores[casting] : undefined

  return {
    ...character,
    level,
    proficiencyBonus,
    hp: { ...character.hp, max, current },
    hitDice: { ...character.hitDice, total: level, used: Math.min(character.hitDice.used, level) },
    spellSaveDC: castingScore !== undefined ? spellSaveDC(castingScore, proficiencyBonus) : character.spellSaveDC,
    spellAttackBonus:
      castingScore !== undefined ? spellAttackBonus(castingScore, proficiencyBonus) : character.spellAttackBonus,
  }
}
