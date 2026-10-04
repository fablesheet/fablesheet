import type { ProficiencyLevel } from './types'

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
