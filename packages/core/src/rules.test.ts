import { describe, expect, it } from 'vitest'
import {
  abilityModifier,
  carryingLimits,
  formatModifier,
  proficiencyBonusForLevel,
  proficiencyContribution,
  savingThrowBonus,
  skillBonus,
  spellAttackBonus,
  spellSaveDC,
} from './rules'

describe('abilityModifier', () => {
  it.each([
    [1, -5],
    [3, -4],
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [12, 1],
    [15, 2],
    [18, 4],
    [20, 5],
    [30, 10],
  ])('score %i → %i', (score, expected) => {
    expect(abilityModifier(score)).toBe(expected)
  })
})

describe('formatModifier', () => {
  it('prefixes non-negative values with +', () => {
    expect(formatModifier(0)).toBe('+0')
    expect(formatModifier(3)).toBe('+3')
  })
  it('keeps the minus sign for negative values', () => {
    expect(formatModifier(-2)).toBe('-2')
  })
})

describe('proficiencyBonusForLevel', () => {
  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ])('level %i → +%i', (level, expected) => {
    expect(proficiencyBonusForLevel(level)).toBe(expected)
  })
  it('clamps out-of-range levels', () => {
    expect(proficiencyBonusForLevel(0)).toBe(2)
    expect(proficiencyBonusForLevel(25)).toBe(6)
  })
})

describe('proficiencyContribution', () => {
  it('handles every proficiency level', () => {
    expect(proficiencyContribution('none', 3)).toBe(0)
    expect(proficiencyContribution('half', 3)).toBe(1)
    expect(proficiencyContribution('proficient', 3)).toBe(3)
    expect(proficiencyContribution('expertise', 3)).toBe(6)
  })
})

describe('skill and saving throw bonuses', () => {
  it('adds ability modifier and proficiency', () => {
    expect(skillBonus(16, 'proficient', 2)).toBe(5)
    expect(skillBonus(16, 'expertise', 2)).toBe(7)
    expect(skillBonus(8, 'none', 2)).toBe(-1)
    expect(savingThrowBonus(14, true, 3)).toBe(5)
    expect(savingThrowBonus(14, false, 3)).toBe(2)
  })
})

describe('spellcasting', () => {
  it('computes save DC and attack bonus', () => {
    expect(spellSaveDC(16, 2)).toBe(13)
    expect(spellAttackBonus(16, 2)).toBe(5)
  })
})

describe('carryingLimits', () => {
  it('scales with Strength', () => {
    expect(carryingLimits(10)).toEqual({ capacity: 150, encumberedAt: 50, heavilyEncumberedAt: 100 })
  })
})
