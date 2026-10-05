import { describe, expect, it } from 'vitest'
import {
  abilityModifier,
  applyDamage,
  applyHealing,
  carryingLimits,
  changeLevel,
  formatModifier,
  hitDieSize,
  levelUp,
  proficiencyBonusForLevel,
  proficiencyContribution,
  savingThrowBonus,
  skillBonus,
  spellAttackBonus,
  spellSaveDC,
} from './rules'
import { migrateCharacter } from './migrations'

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

describe('changeLevel', () => {
  const wizard = migrateCharacter({
    id: 'w',
    name: 'Wizard',
    level: 1,
    proficiencyBonus: 2,
    scores: { strength: 8, dexterity: 14, constitution: 14, intelligence: 16, wisdom: 12, charisma: 10 },
    hp: { current: 8, max: 8, temp: 0 },
    hitDice: { die: 'd6', total: 1, used: 1 },
    spellcastingAbility: 'intelligence',
    spellSaveDC: 13,
    spellAttackBonus: 5,
  })

  it('recalculates level-dependent values when levelling up', () => {
    const lvl5 = changeLevel(wizard, 5)
    expect(lvl5.level).toBe(5)
    expect(lvl5.proficiencyBonus).toBe(3)
    expect(lvl5.hitDice).toEqual({ die: 'd6', total: 5, used: 1 })
    // d6 average 4 + CON +2 = 6 per level, 4 levels
    expect(lvl5.hp).toEqual({ current: 32, max: 32, temp: 0 })
    expect(lvl5.spellSaveDC).toBe(14)
    expect(lvl5.spellAttackBonus).toBe(6)
  })

  it('reverses cleanly when levelling down', () => {
    expect(changeLevel(changeLevel(wizard, 5), 1)).toEqual(wizard)
  })

  it('clamps the level and keeps used hit dice within the total', () => {
    expect(changeLevel(wizard, 30).level).toBe(20)
    const used = { ...wizard, level: 3, hitDice: { die: 'd6', total: 3, used: 3 } }
    expect(changeLevel(used, 2).hitDice.used).toBe(2)
  })

  it('gains at least 1 HP per level with a low Constitution', () => {
    const frail = { ...wizard, scores: { ...wizard.scores, constitution: 1 } }
    expect(changeLevel(frail, 2).hp.max).toBe(9)
  })
})

describe('levelUp', () => {
  const fighter = migrateCharacter({
    id: 'f',
    name: 'Fighter',
    level: 3,
    proficiencyBonus: 2,
    initiativeBonus: 1,
    scores: { strength: 16, dexterity: 13, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
    hp: { current: 20, max: 28, temp: 0 },
    hitDice: { die: 'd10', total: 3, used: 0 },
    spellcastingAbility: null,
  })

  it('adds the hit die result plus Constitution modifier', () => {
    const up = levelUp(fighter, { hitDieResult: 7 })
    expect(up.level).toBe(4)
    expect(up.hitDice.total).toBe(4)
    expect(up.hp).toEqual({ current: 29, max: 37, temp: 0 })
  })

  it('applies an ability score improvement, capped at 20, with retroactive HP', () => {
    const up = levelUp(fighter, { hitDieResult: 6, abilityIncreases: { constitution: 1, dexterity: 1 } })
    expect(up.scores.constitution).toBe(16)
    expect(up.scores.dexterity).toBe(14)
    // 6 + CON +3 for the new level, +1 for each of the 3 earlier levels
    expect(up.hp.max).toBe(28 + 9 + 3)
    expect(up.initiativeBonus).toBe(2)
    const capped = levelUp(
      { ...fighter, scores: { ...fighter.scores, strength: 19 } },
      {
        hitDieResult: 6,
        abilityIncreases: { strength: 2 },
      },
    )
    expect(capped.scores.strength).toBe(20)
  })

  it('sets the subclass, gains at least 1 HP and stops at level 20', () => {
    const frail = { ...fighter, scores: { ...fighter.scores, constitution: 3 } }
    const up = levelUp(frail, { hitDieResult: 1, subclass: 'Champion' })
    expect(up.subclass).toBe('Champion')
    expect(up.hp.max).toBe(29)
    expect(levelUp({ ...fighter, level: 20 }, { hitDieResult: 5 }).level).toBe(20)
  })

  it('adds bonus hit points per level, such as Dwarven Toughness', () => {
    expect(levelUp(fighter, { hitDieResult: 6, bonusHitPointsPerLevel: 1 }).hp.max).toBe(28 + 8 + 1)
  })

  it('updates the proficiency bonus at 5th level', () => {
    expect(levelUp({ ...fighter, level: 4 }, { hitDieResult: 6 }).proficiencyBonus).toBe(3)
  })
})

describe('hitDieSize', () => {
  it('parses hit die strings', () => {
    expect(hitDieSize('d12')).toBe(12)
    expect(hitDieSize('D6')).toBe(6)
    expect(hitDieSize('??')).toBe(8)
  })
})

describe('applyDamage / applyHealing', () => {
  const hero = migrateCharacter({ id: 'h', name: 'Hero', hp: { current: 10, max: 20, temp: 5 } })

  it('removes temporary hit points first', () => {
    expect(applyDamage(hero, 3).hp).toEqual({ current: 10, max: 20, temp: 2 })
    expect(applyDamage(hero, 8).hp).toEqual({ current: 7, max: 20, temp: 0 })
  })

  it('does not go below 0', () => {
    expect(applyDamage(hero, 100).hp.current).toBe(0)
  })

  it('heals up to the maximum and resets death saves when healed from 0', () => {
    expect(applyHealing(hero, 50).hp.current).toBe(20)
    const down = { ...hero, hp: { current: 0, max: 20, temp: 0 }, deathSaves: { successes: 1, failures: 2 } }
    expect(applyHealing(down, 4)).toMatchObject({ hp: { current: 4 }, deathSaves: { successes: 0, failures: 0 } })
  })

  it('ignores negative or fractional amounts', () => {
    expect(applyDamage(hero, -5)).toEqual(hero)
    expect(applyHealing(hero, 0)).toBe(hero)
    expect(applyDamage(hero, 2.9).hp.temp).toBe(3)
  })
})
